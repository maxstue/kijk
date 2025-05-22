START TRANSACTION;

-- Insert roles
INSERT INTO roles (id, name, created_at)
VALUES ('0195624d-3c82-73e8-bb7b-b3fac043f2cb', 'User', now()),
       ('0195624d-5bd9-754c-a92b-5e0e82e1ede1', 'Admin', now());

-- Insert permissions
INSERT INTO permissions (id, name, created_at)
VALUES ('0195624d-6b3b-7085-84ff-e4b906cfd0df', 'Read', now()),
       ('0195624d-7a57-7248-86b6-9b2bdac93e4f', 'Write', now()),
       ('0195624d-8a9b-76d1-b9df-64e05622e324', 'Manage', now());

-- Assign permissions to User role
INSERT INTO roles_permissions (roles_id, permissions_id)
VALUES ('0195624d-3c82-73e8-bb7b-b3fac043f2cb', '0195624d-6b3b-7085-84ff-e4b906cfd0df'), -- User - Read
       ('0195624d-3c82-73e8-bb7b-b3fac043f2cb', '0195624d-7a57-7248-86b6-9b2bdac93e4f');
-- User - Write

-- Assign permissions to Admin role
INSERT INTO roles_permissions (roles_id, permissions_id)
VALUES ('0195624d-5bd9-754c-a92b-5e0e82e1ede1', '0195624d-6b3b-7085-84ff-e4b906cfd0df'), -- Admin - Read
       ('0195624d-5bd9-754c-a92b-5e0e82e1ede1', '0195624d-7a57-7248-86b6-9b2bdac93e4f'), -- Admin - Write
       ('0195624d-5bd9-754c-a92b-5e0e82e1ede1', '0195624d-8a9b-76d1-b9df-64e05622e324'); -- Admin - Manage

COMMIT;


-- Insert default resource types
START TRANSACTION;
INSERT INTO resources (id, name, color, unit, creator_type, created_at)
VALUES ('0195624d-9b3b-7a85-84ff-e4b906cfd0df', 'Water', '#3498db', 'L', 'system', now()),
       ('0195624d-0a57-7a48-86b6-9b2bdac93e4f', 'Electricity', '#f1c40f', 'kWh', 'system', now()),
       ('0195624d-1a9b-7ad1-b9df-64e05622e324', 'Gas', '#e74c3c', 'm3', 'system', now());
COMMIT;