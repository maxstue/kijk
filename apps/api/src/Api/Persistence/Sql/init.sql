START TRANSACTION;
INSERT INTO categories (id, name, color, type, creator_type, created_at)
VALUES
-- Income
('01941d25-3bcc-7ff3-b20d-2932dd2b5806','Income', '#232e4b', 'income', 'default', 'now()'),
('01941d25-4afd-7ccd-abd8-d0a8fd8bac3c','Other Income', '#232e4b', 'income', 'default', 'now()'),
('01941d25-5b2f-7ee0-89c4-14049c585bbd','Cash', '#439145', 'income', 'default', 'now()'),
-- Expenses
('01941d24-2b23-7ee9-9ba6-30fe856476ae','Cash', '#325e33', 'expense', 'default', 'now()'),
('01941d24-474e-7ff7-9498-d8846241882a','Insurance', '#795c5e', 'expense', 'default', 'now()'),
('01941d24-574a-766c-908f-e93fcbb1c250','Vacation', '#e36d4f', 'expense', 'default', 'now()'),
('01941d24-64ba-7bb9-9527-e189595e7d99','Food', '#e6b84b', 'expense', 'default', 'now()'),
('01941d24-81b4-7ee5-9c13-50499b50943e','Shopping', '#66d2d8', 'expense', 'default', 'now()'),
('01941d24-92d6-7cc4-8de3-8fb6b2c7c667','Transportation', '#7d10a4', 'expense', 'default', 'now()'),
('01941d24-aa9f-733d-bbae-6fe56315d317','Mobility', '#e222e6', 'expense', 'default', 'now()'),
('01941d24-baa8-7eed-aeb9-b1168bcf0b80','Living', '#232e4b', 'expense', 'default', 'now()'),
('01941d24-cc56-7117-80da-1528cfd175cd','Other Expense', '#496b83', 'expense', 'default', 'now()'),
('01941d24-da69-7445-a6aa-93dacf7710c4','Pets', '#6a7456', 'expense', 'default', 'now()'),
('01941d24-edde-7335-aca4-5967b7d1bc2b','Children', '#c046', 'expense', 'default', 'now()'),
('01941d24-fd28-7666-82ca-5256f6e3ef6d','Entertainment', '#232e4b', 'expense', 'default', 'now()'),
('01941d25-0c84-7eed-a026-43a840bc6014','Subscription', '#BA93F8', 'expense', 'default', 'now()'),
('01941d25-1b5d-7441-b330-5f434193c33e','Education', '#da3e48', 'expense', 'default', 'now()'),
('01941d25-293b-7cce-bc49-d93573237c06','Uncategorized', '#616161', 'expense', 'default', 'now()');
COMMIT;