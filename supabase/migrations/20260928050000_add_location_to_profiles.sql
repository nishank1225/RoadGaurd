/*
# Add location (latitude, longitude) columns to profiles and update handle_new_user trigger
*/

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS latitude double precision DEFAULT null,
ADD COLUMN IF NOT EXISTS longitude double precision DEFAULT null;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone, latitude, longitude)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    NULLIF(NEW.raw_user_meta_data->>'latitude', '')::double precision,
    NULLIF(NEW.raw_user_meta_data->>'longitude', '')::double precision
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    latitude = COALESCE(EXCLUDED.latitude, profiles.latitude),
    longitude = COALESCE(EXCLUDED.longitude, profiles.longitude);
  RETURN NEW;
END;
$$;
