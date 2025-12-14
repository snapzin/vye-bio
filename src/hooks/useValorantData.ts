import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface MMRData {
  current?: {
    tier?: {
      id: number;
      name: string;
    };
    rr?: number;
  };
  account?: {
    puuid?: string;
    level?: number;
  };
}

interface CacheEntry {
  data: MMRData;
  timestamp: number;
}

// Cache global para evitar múltiplas requisições
const cache = new Map<string, CacheEntry>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
const POLLING_INTERVAL = 5 * 60 * 1000; // 5 minutos entre requisições
const STORAGE_PREFIX = "vye:valorant:mmr:";

export function useValorantData(
  valorantName: string | null,
  valorantTag: string | null,
  valorantPuuid: string | null,
  region: string = "br",
  platform: string = "pc"
) {
  const { user } = useAuth();
  const [mmrData, setMmrData] = useState<MMRData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchRef = useRef<number>(0);

  const getCacheKey = (name: string, tag: string, region: string, platform: string) => {
    return `valorant_${region}_${platform}_${name}_${tag}`;
  };

  const getStorageKey = (cacheKey: string) => `${STORAGE_PREFIX}${cacheKey}`;

  const readFromStorage = (cacheKey: string): CacheEntry | null => {
    try {
      if (typeof window === "undefined") return null;
      const raw = window.localStorage.getItem(getStorageKey(cacheKey));
      if (!raw) return null;
      const parsed = JSON.parse(raw) as CacheEntry;
      if (!parsed || typeof parsed.timestamp !== "number" || !parsed.data) return null;
      return parsed;
    } catch {
      return null;
    }
  };

  const writeToStorage = (cacheKey: string, entry: CacheEntry) => {
    try {
      if (typeof window === "undefined") return;
      window.localStorage.setItem(getStorageKey(cacheKey), JSON.stringify(entry));
    } catch {
      // ignore quota / private mode errors
    }
  };

  const isEntryValid = (entry: CacheEntry | null): boolean => {
    if (!entry) return false;
    const now = Date.now();
    return (now - entry.timestamp) < CACHE_DURATION;
  };

  const isCacheValid = (cacheKey: string): boolean => {
    const mem = cache.get(cacheKey);
    if (isEntryValid(mem || null)) return true;

    // fallback: persistent cache (survives F5)
    const stored = readFromStorage(cacheKey);
    return isEntryValid(stored);
  };

  const getCachedData = (cacheKey: string): MMRData | null => {
    const mem = cache.get(cacheKey);
    if (isEntryValid(mem || null)) return mem!.data;

    // fallback: localStorage
    const stored = readFromStorage(cacheKey);
    if (isEntryValid(stored)) {
      // hydrate memory cache for the session
      cache.set(cacheKey, stored!);
      return stored!.data;
    }

    return null;
  };

  const setCachedData = (cacheKey: string, data: MMRData) => {
    const entry: CacheEntry = { data, timestamp: Date.now() };
    cache.set(cacheKey, entry);
    // persistent cache so refresh (F5) doesn't refetch
    writeToStorage(cacheKey, entry);
  };

  const fetchAndSavePuuid = useCallback(async () => {
    if (!user || !valorantName || !valorantTag || valorantPuuid) return;

    try {
      // Sempre usa proxy para evitar problemas de CORS
      const baseUrl = '/api/valorant';
      
      // O proxy já inclui /valorant no rewrite, então não precisa adicionar
      const accountPath = `/v2/account/${encodeURIComponent(valorantName)}/${encodeURIComponent(valorantTag)}`;
      
      const accountUrl = `${baseUrl}${accountPath}`;
      const accountResponse = await fetch(accountUrl, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (accountResponse.ok) {
        const accountResult = await accountResponse.json();
        // v2 retorna status: 1 para sucesso
        if ((accountResult.status === 1 || accountResult.status === 200) && accountResult.data?.puuid) {
          // Atualiza o perfil com o puuid
          const { error } = await supabase
            .from('profiles')
            .update({ valorant_puuid: accountResult.data.puuid } as Record<string, unknown>)
            .eq('user_id', user.id);
          
          if (error) {
            console.error("Erro ao salvar puuid:", error);
          }
        }
      }
    } catch (err) {
      console.error("Erro ao buscar/salvar puuid:", err);
    }
  }, [user, valorantName, valorantTag, valorantPuuid]);

  const fetchMMR = useCallback(async (useCache: boolean = true) => {
    if (!valorantName || !valorantTag) {
      setMmrData(null);
      return;
    }

    const cacheKey = getCacheKey(valorantName, valorantTag, region, platform);
    
    // Verifica cache primeiro
    if (useCache) {
      const cached = getCachedData(cacheKey);
      if (cached) {
        setMmrData(cached);
        setError(null);
        return;
      }
    }

    // Evita requisições muito frequentes (rate limiting)
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchRef.current;
    if (timeSinceLastFetch < 1000) {
      // Se fez uma requisição há menos de 1 segundo, usa cache se disponível
      const cached = getCachedData(cacheKey);
      if (cached) {
        setMmrData(cached);
        return;
      }
      // Se não tem cache, espera um pouco
      await new Promise(resolve => setTimeout(resolve, 1000 - timeSinceLastFetch));
    }

    setIsLoading(true);
    setError(null);
    lastFetchRef.current = Date.now();

    try {
      // Sempre usa proxy para evitar problemas de CORS
      const baseUrl = '/api/valorant';
      
      // v3 requer region, platform, name, tag
      // O proxy já inclui /valorant no rewrite, então não precisa adicionar
      const apiPath = `/v3/mmr/${region}/${platform}/${encodeURIComponent(valorantName)}/${encodeURIComponent(valorantTag)}`;
      
      const url = `${baseUrl}${apiPath}`;
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("Muitas requisições. Tente novamente em alguns minutos.");
        }
        throw new Error("Erro ao buscar dados do Valorant");
      }

      const result = await response.json();

      // v3 retorna status: 200 para sucesso
      if (result.status === 200 && result.data) {
        const data = result.data;
        
        // Busca o nível da conta se não estiver no MMR
        if (!data.account?.level) {
          try {
            // Sempre usa proxy para evitar problemas de CORS
            const baseUrl = '/api/valorant';
            
            // O proxy já inclui /valorant no rewrite, então não precisa adicionar
            const accountPath = `/v2/account/${encodeURIComponent(valorantName)}/${encodeURIComponent(valorantTag)}`;
            
            const accountUrl = `${baseUrl}${accountPath}`;
            const accountResponse = await fetch(accountUrl, {
              headers: {
                'Content-Type': 'application/json',
              },
            });
            
            if (accountResponse.ok) {
              const accountResult = await accountResponse.json();
              if ((accountResult.status === 1 || accountResult.status === 200) && accountResult.data) {
                // Adiciona o nível ao data se disponível
                if (accountResult.data.account_level !== undefined) {
                  data.account = {
                    ...data.account,
                    level: accountResult.data.account_level,
                  };
                }
              }
            }
          } catch (err) {
            // Ignora erros ao buscar nível
          }
        }
        
        setMmrData(data);
        setCachedData(cacheKey, data);

        // Salva o puuid se disponível na resposta do MMR ou busca da API de account
        if (data.account?.puuid && !valorantPuuid) {
          const { error } = await supabase
            .from('profiles')
            .update({ valorant_puuid: data.account.puuid } as Record<string, unknown>)
            .eq('user_id', user?.id || '');
          
          if (error) {
            console.error("Erro ao salvar puuid:", error);
          }
        } else if (!valorantPuuid) {
          // Se não veio no MMR, busca da API de account
          fetchAndSavePuuid();
        }
      } else if (result.status === 404) {
        throw new Error("Jogador não encontrado");
      } else {
        throw new Error(result.message || result.errors?.[0]?.message || "Erro ao buscar dados do Valorant");
      }
    } catch (err: any) {
      setError(err.message || "Erro ao buscar dados do Valorant");
      
      // Tenta usar cache em caso de erro
      const cached = getCachedData(cacheKey);
      if (cached) {
        setMmrData(cached);
      } else {
        setMmrData(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [valorantName, valorantTag, region, platform, valorantPuuid, user?.id, fetchAndSavePuuid]);

  useEffect(() => {
    if (!valorantName || !valorantTag) {
      setMmrData(null);
      setError(null);
      return;
    }

    // Busca inicial (com cache)
    fetchMMR(true);

    // Configura polling (só busca se o cache expirou)
    pollingIntervalRef.current = setInterval(() => {
      const cacheKey = getCacheKey(valorantName, valorantTag, region, platform);
      if (!isCacheValid(cacheKey)) {
        fetchMMR(false);
      }
    }, POLLING_INTERVAL);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [valorantName, valorantTag, region, platform, fetchMMR]);

  return { mmrData, isLoading, error };
}

