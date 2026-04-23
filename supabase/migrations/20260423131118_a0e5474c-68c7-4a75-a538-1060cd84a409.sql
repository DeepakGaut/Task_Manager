CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  IF TG_TABLE_NAME = 'tasks' THEN
    IF NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed' THEN
      NEW.completed_at = now();
    ELSIF NEW.status <> 'completed' THEN
      NEW.completed_at = NULL;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;