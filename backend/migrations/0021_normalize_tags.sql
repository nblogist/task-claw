-- Normalize all existing tags: lowercase, spaces→dashes, strip special chars, collapse dashes
UPDATE tasks SET tags = (
  SELECT coalesce(array_agg(normalized ORDER BY ordinality), '{}')
  FROM (
    SELECT
      trim(both '-' from
        regexp_replace(
          regexp_replace(
            regexp_replace(
              lower(trim(t)),
              '\s+', '-', 'g'        -- spaces → dashes
            ),
            '[^a-z0-9-]', '', 'g'    -- strip special chars
          ),
          '-+', '-', 'g'             -- collapse multiple dashes
        )
      ) AS normalized,
      ordinality
    FROM unnest(tags) WITH ORDINALITY AS t
  ) sub
  WHERE normalized != ''
);
