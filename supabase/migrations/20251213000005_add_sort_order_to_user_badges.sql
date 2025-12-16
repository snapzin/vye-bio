-- Add sort_order field to user_badges table
ALTER TABLE public.user_badges
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Update existing records to have sequential sort_order based on earned_at
UPDATE public.user_badges ub
SET sort_order = sub.row_num - 1
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY earned_at) as row_num
  FROM public.user_badges
) sub
WHERE ub.id = sub.id;

