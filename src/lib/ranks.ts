/**
 * Utilitários para ranks do Valorant
 * Baseado na lógica do bot Discord (iso)
 */

/**
 * Converte tier numérico para nome do rank em português
 */
export function tierToRankName(tier: number | null | undefined): string | null {
  if (tier === undefined || tier === null) return null;

  if (tier >= 3 && tier <= 5) {
    return `Ferro ${tier - 2}`;
  } else if (tier >= 6 && tier <= 8) {
    return `Bronze ${tier - 5}`;
  } else if (tier >= 9 && tier <= 11) {
    return `Prata ${tier - 8}`;
  } else if (tier >= 12 && tier <= 14) {
    return `Ouro ${tier - 11}`;
  } else if (tier >= 15 && tier <= 17) {
    return `Platina ${tier - 14}`;
  } else if (tier >= 18 && tier <= 20) {
    return `Diamante ${tier - 17}`;
  } else if (tier >= 21 && tier <= 23) {
    return `Ascendente ${tier - 20}`;
  } else if (tier >= 24 && tier <= 26) {
    return `Imortal ${tier - 23}`;
  } else if (tier >= 27) {
    return 'Radiante';
  }

  return null;
}

/**
 * Obtém o nome base do rank (sem número) a partir do tier
 */
export function getBaseRankName(tier: number | null | undefined): string {
  if (tier === undefined || tier === null) return "Sem Ranque";

  if (tier >= 3 && tier <= 5) {
    return "Ferro";
  } else if (tier >= 6 && tier <= 8) {
    return "Bronze";
  } else if (tier >= 9 && tier <= 11) {
    return "Prata";
  } else if (tier >= 12 && tier <= 14) {
    return "Ouro";
  } else if (tier >= 15 && tier <= 17) {
    return "Platina";
  } else if (tier >= 18 && tier <= 20) {
    return "Diamante";
  } else if (tier >= 21 && tier <= 23) {
    return "Ascendente";
  } else if (tier >= 24 && tier <= 26) {
    return "Imortal";
  } else if (tier >= 27) {
    return "Radiante";
  }

  return "Sem Ranque";
}

/**
 * Mapeamento de ranks para URLs de imagens da API do Valorant
 * Baseado na lógica do bot Discord
 */
const ELO_IMAGES: Record<string, string> = {
  "Sem Ranque": "https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/0/largeicon.png",
  "Ferro": "https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/5/largeicon.png",
  "Bronze": "https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/8/largeicon.png",
  "Prata": "https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/11/largeicon.png",
  "Ouro": "https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/14/largeicon.png",
  "Platina": "https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/17/largeicon.png",
  "Diamante": "https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/20/largeicon.png",
  "Ascendente": "https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/23/largeicon.png",
  "Imortal": "https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/26/largeicon.png",
  "Radiante": "https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/27/largeicon.png",
};

/**
 * Obtém a URL da imagem do elo baseado no tier ID
 */
export function getRankImageUrl(tier: number | null | undefined): string {
  const baseRank = getBaseRankName(tier);
  return ELO_IMAGES[baseRank] || ELO_IMAGES["Sem Ranque"];
}

/**
 * Obtém a URL da imagem do elo baseado no nome do tier (em inglês ou português)
 */
export function getRankImageUrlByName(tierName: string | null | undefined): string {
  if (!tierName) return ELO_IMAGES["Sem Ranque"];

  // Normalizar o nome do tier
  const normalized = tierName.trim();
  
  // Mapear nomes em inglês para português
  const nameMap: Record<string, string> = {
    "Iron": "Ferro",
    "Bronze": "Bronze",
    "Silver": "Prata",
    "Gold": "Ouro",
    "Platinum": "Platina",
    "Diamond": "Diamante",
    "Ascendant": "Ascendente",
    "Immortal": "Imortal",
    "Radiant": "Radiante",
    "Unrated": "Sem Ranque",
  };

  // Tentar encontrar o nome base (remover números e espaços extras)
  const baseName = normalized.split(/\s+/)[0];
  const mappedName = nameMap[baseName] || baseName;

  return ELO_IMAGES[mappedName] || ELO_IMAGES["Sem Ranque"];
}

