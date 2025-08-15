START TRANSACTION;
-- This SQL script creates a trigger function to automatically update the "UpdatedAt" timestamp
CREATE FUNCTION "Update_DateTime_Function"() RETURNS TRIGGER
    LANGUAGE PLPGSQL AS
$$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$;

-- Add Trigger to the consumptions table
CREATE TRIGGER "UpdateTimestamp"
    BEFORE UPDATE
    ON "consumptions"
    FOR EACH ROW
EXECUTE FUNCTION "Update_DateTime_Function"();

-- Add Trigger to the consumptions_limits table
CREATE TRIGGER "UpdateTimestamp"
    BEFORE UPDATE
    ON "consumptions_limits"
    FOR EACH ROW
EXECUTE FUNCTION "Update_DateTime_Function"();

-- Add Trigger to the households table
CREATE TRIGGER "UpdateTimestamp"
    BEFORE UPDATE
    ON "households"
    FOR EACH ROW
EXECUTE FUNCTION "Update_DateTime_Function"();

-- Add Trigger to the permissions table
CREATE TRIGGER "UpdateTimestamp"
    BEFORE UPDATE
    ON "permissions"
    FOR EACH ROW
EXECUTE FUNCTION "Update_DateTime_Function"();

-- Add Trigger to the resources table
CREATE TRIGGER "UpdateTimestamp"
    BEFORE UPDATE
    ON "resources"
    FOR EACH ROW
EXECUTE FUNCTION "Update_DateTime_Function"();

-- Add Trigger to the roles table
CREATE TRIGGER "UpdateTimestamp"
    BEFORE UPDATE
    ON "roles"
    FOR EACH ROW
EXECUTE FUNCTION "Update_DateTime_Function"();

-- Add Trigger to the user_households table
CREATE TRIGGER "UpdateTimestamp"
    BEFORE UPDATE
    ON "user_households"
    FOR EACH ROW
EXECUTE FUNCTION "Update_DateTime_Function"();

-- Add Trigger to the users table
CREATE TRIGGER "UpdateTimestamp"
    BEFORE UPDATE
    ON "users"
    FOR EACH ROW
EXECUTE FUNCTION "Update_DateTime_Function"();

COMMIT;