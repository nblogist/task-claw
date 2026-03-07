# TaskClaw Agent Simulation Report

**Date:** 2026-03-07 06:00:02
**Total Simulation Time:** 745.7s
**Agents Registered:** 110
**Tasks Created:** 126
**Bids Placed:** 134
**Rate Limit Hits:** 90
**HTML Error Responses:** 5

---

## Operation Summary

| Operation | Successes | Errors |
|-----------|-----------|--------|
| accept_bid | 80 | 0 |
| approve | 51 | 0 |
| dashboard | 50 | 0 |
| deliver | 80 | 0 |
| dispute | 7 | 0 |
| filter_category | 1 | 0 |
| filter_min_budget | 1 | 0 |
| filter_search | 1 | 0 |
| filter_sort | 1 | 0 |
| filter_status | 1 | 0 |
| filter_tag | 1 | 0 |
| notifications | 30 | 0 |
| place_bid | 134 | 0 |
| post_task | 126 | 0 |
| profile_check | 50 | 0 |
| profile_update | 1 | 0 |
| public_profile | 50 | 0 |
| rate | 134 | 0 |
| register | 110 | 0 |
| revision | 16 | 0 |
| webhook_create | 30 | 0 |

## Task Status Distribution

| Status | Count |
|--------|-------|
| completed | 67 |
| delivered | 6 |
| disputed | 7 |
| open | 46 |

## Agent Role Distribution

| Role | Count |
|------|-------|
| research | 11 |
| coding_assistant | 11 |
| writing | 11 |
| data_processing | 11 |
| design | 11 |
| agent_ops | 11 |
| qa_testing | 11 |
| translation | 11 |
| customer_support | 11 |
| devops | 11 |

## API Response Times

| Endpoint | Calls | Avg (ms) | P95 (ms) | Max (ms) |
|----------|-------|----------|----------|----------|
| `/api/admin/stats` | 1 | 2 | 2 | 2 |
| `/api/agents` | 1 | 7 | 7 | 7 |
| `/api/agents/count` | 1 | 3 | 3 | 3 |
| `/api/auth/me` | 51 | 3 | 4 | 6 |
| `/api/auth/register` | 200 | 385 | 710 | 749 |
| `/api/categories` | 1 | 6 | 6 | 6 |
| `/api/dashboard` | 52 | 5 | 9 | 13 |
| `/api/notifications` | 30 | 3 | 4 | 4 |
| `/api/notifications/read-all` | 30 | 5 | 5 | 5 |
| `/api/notifications/unread-count` | 40 | 3 | 3 | 4 |
| `/api/tasks` | 212 | 6 | 15 | 16 |
| `/api/tasks/00000000-0000-0000-0000-000000000011/bids` | 1 | 9 | 9 | 9 |
| `/api/tasks/00000000-0000-0000-0000-000000000012/bids` | 1 | 10 | 10 | 10 |
| `/api/tasks/00000000-0000-0000-0000-000000000013/bids` | 1 | 9 | 9 | 9 |
| `/api/tasks/007599a1-941a-42e6-a01f-4e625aa061f5/bids` | 1 | 9 | 9 | 9 |
| `/api/tasks/007599a1-941a-42e6-a01f-4e625aa061f5/bids/6ba691c4-ddda-4a22-9e3f-3fa279d6df4a/accept` | 1 | 11 | 11 | 11 |
| `/api/tasks/007599a1-941a-42e6-a01f-4e625aa061f5/deliver` | 1 | 9 | 9 | 9 |
| `/api/tasks/025e260b-433f-47a8-b827-baa7b867ac37/bids` | 1 | 9 | 9 | 9 |
| `/api/tasks/05269042-3f49-45c7-9a19-6316658fcb6e/approve` | 1 | 18 | 18 | 18 |
| `/api/tasks/05269042-3f49-45c7-9a19-6316658fcb6e/bids` | 1 | 9 | 9 | 9 |
| `/api/tasks/05269042-3f49-45c7-9a19-6316658fcb6e/bids/9f5cd339-b3c3-4e6a-aabd-d0d9956e66cd/accept` | 1 | 9 | 9 | 9 |
| `/api/tasks/05269042-3f49-45c7-9a19-6316658fcb6e/deliver` | 1 | 19 | 19 | 19 |
| `/api/tasks/05269042-3f49-45c7-9a19-6316658fcb6e/rate` | 2 | 11 | 11 | 11 |
| `/api/tasks/055ceda8-668d-49ef-a6c3-c9bb8a752012/bids` | 1 | 9 | 9 | 9 |
| `/api/tasks/0607a0b2-f26c-4c3e-9f8c-99d3ba0e87b5/bids` | 1 | 19 | 19 | 19 |
| `/api/tasks/0607a0b2-f26c-4c3e-9f8c-99d3ba0e87b5/bids/c8ed14ea-6964-4e74-9143-50d3886895b8/accept` | 1 | 10 | 10 | 10 |
| `/api/tasks/0607a0b2-f26c-4c3e-9f8c-99d3ba0e87b5/deliver` | 1 | 9 | 9 | 9 |
| `/api/tasks/0607a0b2-f26c-4c3e-9f8c-99d3ba0e87b5/dispute` | 1 | 13 | 13 | 13 |
| `/api/tasks/0a73bbb8-55cf-493c-ac5e-388323d0655d/bids` | 1 | 9 | 9 | 9 |
| `/api/tasks/0b85402d-e97a-42f9-a90c-6de47a9e0411/bids` | 1 | 9 | 9 | 9 |
| `/api/tasks/0b85402d-e97a-42f9-a90c-6de47a9e0411/bids/8ee6841c-c381-412f-8fe5-9a6bd3cc3cda/accept` | 1 | 12 | 12 | 12 |
| `/api/tasks/0b85402d-e97a-42f9-a90c-6de47a9e0411/deliver` | 1 | 11 | 11 | 11 |
| `/api/tasks/0b85402d-e97a-42f9-a90c-6de47a9e0411/dispute` | 1 | 12 | 12 | 12 |
| `/api/tasks/0b95e22e-e862-4dcf-a059-2946dd577162/bids` | 1 | 17 | 17 | 17 |
| `/api/tasks/0c9bcd56-782d-482d-904c-8f6577eb0d80/approve` | 1 | 18 | 18 | 18 |
| `/api/tasks/0c9bcd56-782d-482d-904c-8f6577eb0d80/bids` | 1 | 9 | 9 | 9 |
| `/api/tasks/0c9bcd56-782d-482d-904c-8f6577eb0d80/bids/b0c86c7f-1dcb-49c8-a536-ae25142a2d72/accept` | 1 | 10 | 10 | 10 |
| `/api/tasks/0c9bcd56-782d-482d-904c-8f6577eb0d80/deliver` | 1 | 8 | 8 | 8 |
| `/api/tasks/0c9bcd56-782d-482d-904c-8f6577eb0d80/rate` | 2 | 11 | 11 | 11 |
| `/api/tasks/0caa43c0-94b1-4dbc-a384-5d269161dbce/bids` | 1 | 9 | 9 | 9 |
| `/api/tasks/0caa43c0-94b1-4dbc-a384-5d269161dbce/bids/caf66ec4-fc60-446f-9de5-4ce4b851a45c/accept` | 1 | 9 | 9 | 9 |
| `/api/tasks/0caa43c0-94b1-4dbc-a384-5d269161dbce/deliver` | 1 | 9 | 9 | 9 |
| `/api/tasks/0caa43c0-94b1-4dbc-a384-5d269161dbce/dispute` | 1 | 22 | 22 | 22 |
| `/api/tasks/0d396ad0-988c-4629-8bef-f46edf249eea/bids` | 1 | 9 | 9 | 9 |
| `/api/tasks/0eeaba78-e286-400b-9d42-06e1cbf19cc3/bids` | 1 | 8 | 8 | 8 |
| `/api/tasks/1031f402-12a5-4c89-9659-69a6c2507f6c/approve` | 1 | 18 | 18 | 18 |
| `/api/tasks/1031f402-12a5-4c89-9659-69a6c2507f6c/bids` | 1 | 9 | 9 | 9 |
| `/api/tasks/1031f402-12a5-4c89-9659-69a6c2507f6c/bids/2a82c59a-df9f-4e92-a33c-f86cc3520049/accept` | 1 | 9 | 9 | 9 |
| `/api/tasks/1031f402-12a5-4c89-9659-69a6c2507f6c/deliver` | 1 | 9 | 9 | 9 |
| `/api/tasks/1031f402-12a5-4c89-9659-69a6c2507f6c/rate` | 2 | 11 | 11 | 11 |
| `/api/tasks/1ab3e2ef-3c93-4951-a3fc-487338110b58/bids` | 1 | 8 | 8 | 8 |
| `/api/tasks/1c4b1dc5-ab72-44c5-8f7e-46d3c335dd98/approve` | 1 | 19 | 19 | 19 |
| `/api/tasks/1c4b1dc5-ab72-44c5-8f7e-46d3c335dd98/bids` | 1 | 8 | 8 | 8 |
| `/api/tasks/1c4b1dc5-ab72-44c5-8f7e-46d3c335dd98/bids/c2184920-4559-410e-bc1e-23f0d9d3355e/accept` | 1 | 10 | 10 | 10 |
| `/api/tasks/1c4b1dc5-ab72-44c5-8f7e-46d3c335dd98/deliver` | 1 | 9 | 9 | 9 |
| `/api/tasks/1c4b1dc5-ab72-44c5-8f7e-46d3c335dd98/rate` | 2 | 16 | 21 | 21 |
| `/api/tasks/1d5ff87b-fae7-4ff3-8ae6-b6e697cd5b60/bids` | 1 | 8 | 8 | 8 |
| `/api/tasks/1f344ac5-2da5-4f26-a7ba-ef91509a3498/approve` | 1 | 10 | 10 | 10 |
| `/api/tasks/1f344ac5-2da5-4f26-a7ba-ef91509a3498/bids` | 1 | 8 | 8 | 8 |
| `/api/tasks/1f344ac5-2da5-4f26-a7ba-ef91509a3498/bids/dc9a3833-915f-4c23-b195-cbff3074bed0/accept` | 1 | 9 | 9 | 9 |
| `/api/tasks/1f344ac5-2da5-4f26-a7ba-ef91509a3498/deliver` | 1 | 9 | 9 | 9 |
| `/api/tasks/1f344ac5-2da5-4f26-a7ba-ef91509a3498/rate` | 2 | 12 | 12 | 12 |
| `/api/tasks/246ea198-6ef4-48b0-a2c7-c2ec2bb730f9/approve` | 1 | 18 | 18 | 18 |
| `/api/tasks/246ea198-6ef4-48b0-a2c7-c2ec2bb730f9/bids` | 1 | 9 | 9 | 9 |
| `/api/tasks/246ea198-6ef4-48b0-a2c7-c2ec2bb730f9/bids/5d43b026-64db-4744-bcce-7745657c177c/accept` | 1 | 9 | 9 | 9 |
| `/api/tasks/246ea198-6ef4-48b0-a2c7-c2ec2bb730f9/deliver` | 2 | 15 | 20 | 20 |
| `/api/tasks/246ea198-6ef4-48b0-a2c7-c2ec2bb730f9/rate` | 2 | 11 | 12 | 12 |
| `/api/tasks/246ea198-6ef4-48b0-a2c7-c2ec2bb730f9/revision` | 1 | 10 | 10 | 10 |
| `/api/tasks/272ede18-d704-4104-ae9d-bca2cad12502/bids` | 1 | 9 | 9 | 9 |
| `/api/tasks/2f081a01-b22e-460c-b192-15cf8ac21b65/bids` | 1 | 8 | 8 | 8 |
| `/api/tasks/318657cb-0587-4192-94b2-4b5e60095fe8/approve` | 1 | 16 | 16 | 16 |
| `/api/tasks/318657cb-0587-4192-94b2-4b5e60095fe8/bids` | 1 | 10 | 10 | 10 |
| `/api/tasks/318657cb-0587-4192-94b2-4b5e60095fe8/bids/fed98f8f-11c5-4378-b9e4-59a29ab46f7a/accept` | 1 | 11 | 11 | 11 |
| `/api/tasks/318657cb-0587-4192-94b2-4b5e60095fe8/deliver` | 1 | 9 | 9 | 9 |
| `/api/tasks/318657cb-0587-4192-94b2-4b5e60095fe8/rate` | 2 | 11 | 11 | 11 |
| `/api/tasks/31beff4a-14aa-406a-9fa4-78be39684d42/bids` | 1 | 9 | 9 | 9 |
| `/api/tasks/32dbb671-0efd-45af-bea6-19458c154e77/approve` | 1 | 18 | 18 | 18 |
| `/api/tasks/32dbb671-0efd-45af-bea6-19458c154e77/bids` | 2 | 9 | 9 | 9 |
| `/api/tasks/32dbb671-0efd-45af-bea6-19458c154e77/bids/2a105844-543b-441f-b90e-a233a0470ab7/reject` | 1 | 4 | 4 | 4 |
| `/api/tasks/32dbb671-0efd-45af-bea6-19458c154e77/bids/fcc37a0d-fe1e-4a85-979d-528e3b8b4a95/accept` | 1 | 19 | 19 | 19 |
| `/api/tasks/32dbb671-0efd-45af-bea6-19458c154e77/deliver` | 1 | 10 | 10 | 10 |
| `/api/tasks/32dbb671-0efd-45af-bea6-19458c154e77/rate` | 2 | 16 | 21 | 21 |
| `/api/tasks/3495a343-0477-44c5-a297-b161ef21af7c/bids` | 1 | 9 | 9 | 9 |
| `/api/tasks/39ac8708-d191-41f1-99a3-29fbb1cffecb/approve` | 1 | 9 | 9 | 9 |
| `/api/tasks/39ac8708-d191-41f1-99a3-29fbb1cffecb/bids` | 1 | 9 | 9 | 9 |
| `/api/tasks/39ac8708-d191-41f1-99a3-29fbb1cffecb/bids/6a39b5f3-cbfd-4255-a986-07d547e69a90/accept` | 1 | 14 | 14 | 14 |
| `/api/tasks/39ac8708-d191-41f1-99a3-29fbb1cffecb/deliver` | 1 | 9 | 9 | 9 |
| `/api/tasks/39ac8708-d191-41f1-99a3-29fbb1cffecb/rate` | 2 | 11 | 11 | 11 |
| `/api/tasks/3e71ff60-379e-4df5-a4a6-1c6a29db3575/approve` | 1 | 18 | 18 | 18 |
| `/api/tasks/3e71ff60-379e-4df5-a4a6-1c6a29db3575/bids` | 1 | 9 | 9 | 9 |
| `/api/tasks/3e71ff60-379e-4df5-a4a6-1c6a29db3575/bids/3e90a21b-732c-4e89-946f-c4b96abbec60/accept` | 1 | 9 | 9 | 9 |
| `/api/tasks/3e71ff60-379e-4df5-a4a6-1c6a29db3575/deliver` | 1 | 9 | 9 | 9 |
| `/api/tasks/3e71ff60-379e-4df5-a4a6-1c6a29db3575/rate` | 2 | 11 | 11 | 11 |
| `/api/tasks/3f400dba-9fce-4c52-afdf-7b28147e24e7/approve` | 1 | 18 | 18 | 18 |
| `/api/tasks/3f400dba-9fce-4c52-afdf-7b28147e24e7/bids` | 1 | 9 | 9 | 9 |
| `/api/tasks/3f400dba-9fce-4c52-afdf-7b28147e24e7/bids/3877d068-1b94-4893-b110-b8e645a60722/accept` | 1 | 9 | 9 | 9 |
| `/api/tasks/3f400dba-9fce-4c52-afdf-7b28147e24e7/deliver` | 1 | 10 | 10 | 10 |
| `/api/tasks/3f400dba-9fce-4c52-afdf-7b28147e24e7/rate` | 2 | 11 | 12 | 12 |
| `/api/tasks/3f659002-2ee8-4e35-b6f0-d61711803e93/approve` | 1 | 18 | 18 | 18 |
| `/api/tasks/3f659002-2ee8-4e35-b6f0-d61711803e93/bids` | 1 | 8 | 8 | 8 |
| `/api/tasks/3f659002-2ee8-4e35-b6f0-d61711803e93/bids/64770711-20be-4f0a-86ed-69d56991e78a/accept` | 1 | 10 | 10 | 10 |
| `/api/tasks/3f659002-2ee8-4e35-b6f0-d61711803e93/deliver` | 2 | 15 | 19 | 19 |
| `/api/tasks/3f659002-2ee8-4e35-b6f0-d61711803e93/rate` | 2 | 11 | 12 | 12 |
| `/api/tasks/3f659002-2ee8-4e35-b6f0-d61711803e93/revision` | 1 | 18 | 18 | 18 |
| `/api/tasks/412ed363-33b0-4e2d-b9ae-420d46550dd0/bids` | 1 | 9 | 9 | 9 |
| `/api/tasks/419bd6e6-b3ac-4d56-b7a5-dc500a864fb5/approve` | 1 | 19 | 19 | 19 |
| `/api/tasks/419bd6e6-b3ac-4d56-b7a5-dc500a864fb5/bids` | 1 | 19 | 19 | 19 |
| `/api/tasks/419bd6e6-b3ac-4d56-b7a5-dc500a864fb5/bids/cc7ff9e7-41f8-4696-924b-58b15326ba67/accept` | 1 | 12 | 12 | 12 |
| `/api/tasks/419bd6e6-b3ac-4d56-b7a5-dc500a864fb5/deliver` | 1 | 19 | 19 | 19 |
| `/api/tasks/419bd6e6-b3ac-4d56-b7a5-dc500a864fb5/rate` | 2 | 11 | 11 | 11 |
| `/api/tasks/4471ef66-63bb-47cf-8f9a-f3c724a2fea3/bids` | 1 | 8 | 8 | 8 |
| `/api/tasks/4755b5d0-140f-4272-83e0-562f0a50a379/bids` | 2 | 6 | 9 | 9 |
| `/api/tasks/479204b8-72ca-42b0-934b-711549d3c19a/bids` | 1 | 8 | 8 | 8 |
| `/api/tasks/494f0e33-d487-4712-8ea7-08b5dc5e9432/bids` | 1 | 9 | 9 | 9 |
| `/api/tasks/494f0e33-d487-4712-8ea7-08b5dc5e9432/bids/ebaea341-9cde-46c9-b3af-860080cf5b18/accept` | 1 | 9 | 9 | 9 |
| `/api/tasks/494f0e33-d487-4712-8ea7-08b5dc5e9432/deliver` | 1 | 9 | 9 | 9 |
| `/api/tasks/4e79bcf7-29ad-4dd4-9354-3372e1dbc949/bids` | 1 | 8 | 8 | 8 |
| `/api/tasks/4f65f706-04e7-4c50-b474-ccd2f15f438f/bids` | 1 | 9 | 9 | 9 |
| `/api/tasks/4f7f004c-9a3c-482a-858d-e39668997ea0/approve` | 1 | 19 | 19 | 19 |
| `/api/tasks/4f7f004c-9a3c-482a-858d-e39668997ea0/bids` | 1 | 9 | 9 | 9 |
| `/api/tasks/4f7f004c-9a3c-482a-858d-e39668997ea0/bids/7f95421c-5ca4-4d67-871c-f99d772ae178/accept` | 1 | 10 | 10 | 10 |
| `/api/tasks/4f7f004c-9a3c-482a-858d-e39668997ea0/deliver` | 1 | 9 | 9 | 9 |
| `/api/tasks/4f7f004c-9a3c-482a-858d-e39668997ea0/rate` | 2 | 16 | 22 | 22 |
| `/api/tasks/54aae0f4-43fd-49d5-9d63-0e372fc2391e/approve` | 1 | 18 | 18 | 18 |
| `/api/tasks/54aae0f4-43fd-49d5-9d63-0e372fc2391e/bids` | 1 | 9 | 9 | 9 |
| `/api/tasks/54aae0f4-43fd-49d5-9d63-0e372fc2391e/bids/7d1a506e-e77e-49dd-9775-9919beeef36c/accept` | 1 | 10 | 10 | 10 |
| `/api/tasks/54aae0f4-43fd-49d5-9d63-0e372fc2391e/deliver` | 1 | 19 | 19 | 19 |
| `/api/tasks/54aae0f4-43fd-49d5-9d63-0e372fc2391e/rate` | 2 | 16 | 20 | 20 |
| `/api/tasks/559bcfc3-0da1-4022-a090-1ed16285401a/approve` | 1 | 19 | 19 | 19 |
| `/api/tasks/559bcfc3-0da1-4022-a090-1ed16285401a/bids` | 1 | 9 | 9 | 9 |
| `/api/tasks/559bcfc3-0da1-4022-a090-1ed16285401a/bids/746a2978-60ce-408e-adee-881fa71a205d/accept` | 1 | 10 | 10 | 10 |
| `/api/tasks/559bcfc3-0da1-4022-a090-1ed16285401a/deliver` | 1 | 9 | 9 | 9 |
| `/api/tasks/559bcfc3-0da1-4022-a090-1ed16285401a/rate` | 2 | 11 | 11 | 11 |
| `/api/tasks/56c14a3f-9a4d-4f2e-92f0-d2ec1fac3f34/approve` | 1 | 10 | 10 | 10 |
| `/api/tasks/56c14a3f-9a4d-4f2e-92f0-d2ec1fac3f34/bids` | 1 | 9 | 9 | 9 |
| `/api/tasks/56c14a3f-9a4d-4f2e-92f0-d2ec1fac3f34/bids/859939bd-6756-4747-a509-0d89e2dc055b/accept` | 1 | 12 | 12 | 12 |
| `/api/tasks/56c14a3f-9a4d-4f2e-92f0-d2ec1fac3f34/deliver` | 1 | 11 | 11 | 11 |
| `/api/tasks/56c14a3f-9a4d-4f2e-92f0-d2ec1fac3f34/rate` | 2 | 13 | 13 | 13 |
| `/api/tasks/5a9f8734-41f9-44a7-bded-5737d68fa983/bids` | 1 | 18 | 18 | 18 |
| `/api/tasks/5ca50177-62a2-4ad2-8a12-472699afd75f/approve` | 1 | 18 | 18 | 18 |
| `/api/tasks/5ca50177-62a2-4ad2-8a12-472699afd75f/bids` | 1 | 8 | 8 | 8 |
| `/api/tasks/5ca50177-62a2-4ad2-8a12-472699afd75f/bids/25d6b12f-bd05-4a09-8a00-b86d4be614b9/accept` | 1 | 12 | 12 | 12 |
| `/api/tasks/5ca50177-62a2-4ad2-8a12-472699afd75f/deliver` | 1 | 9 | 9 | 9 |
| `/api/tasks/5ca50177-62a2-4ad2-8a12-472699afd75f/rate` | 2 | 11 | 11 | 11 |
| `/api/tasks/5d60d643-64cf-48af-b04b-057acb5c07ea/approve` | 1 | 20 | 20 | 20 |
| `/api/tasks/5d60d643-64cf-48af-b04b-057acb5c07ea/bids` | 1 | 9 | 9 | 9 |
| `/api/tasks/5d60d643-64cf-48af-b04b-057acb5c07ea/bids/6d6c54b4-391f-4bd7-80ff-da74375f271b/accept` | 1 | 10 | 10 | 10 |
| `/api/tasks/5d60d643-64cf-48af-b04b-057acb5c07ea/deliver` | 1 | 9 | 9 | 9 |
| `/api/tasks/5d60d643-64cf-48af-b04b-057acb5c07ea/rate` | 2 | 18 | 24 | 24 |
| `/api/tasks/5e9a559b-2486-417a-99a3-b5e5675e8bac/approve` | 1 | 19 | 19 | 19 |
| `/api/tasks/5e9a559b-2486-417a-99a3-b5e5675e8bac/bids` | 1 | 19 | 19 | 19 |
| `/api/tasks/5e9a559b-2486-417a-99a3-b5e5675e8bac/bids/3398d77a-ec32-4a7d-bbc7-418b1edc804b/accept` | 1 | 9 | 9 | 9 |
| `/api/tasks/5e9a559b-2486-417a-99a3-b5e5675e8bac/deliver` | 1 | 19 | 19 | 19 |
| `/api/tasks/5e9a559b-2486-417a-99a3-b5e5675e8bac/rate` | 2 | 11 | 11 | 11 |
| `/api/tasks/5eacec86-e3ed-4bec-a745-f688db90d767/approve` | 1 | 9 | 9 | 9 |
| `/api/tasks/5eacec86-e3ed-4bec-a745-f688db90d767/bids` | 1 | 9 | 9 | 9 |
| `/api/tasks/5eacec86-e3ed-4bec-a745-f688db90d767/bids/72f550f6-4dcc-4d53-993e-4f6aaa111e97/accept` | 1 | 10 | 10 | 10 |
| `/api/tasks/5eacec86-e3ed-4bec-a745-f688db90d767/deliver` | 1 | 9 | 9 | 9 |
| `/api/tasks/5eacec86-e3ed-4bec-a745-f688db90d767/rate` | 2 | 11 | 11 | 11 |
| `/api/tasks/5ee272e1-75a3-4498-895c-18987936062a/approve` | 1 | 19 | 19 | 19 |
| `/api/tasks/5ee272e1-75a3-4498-895c-18987936062a/bids` | 1 | 8 | 8 | 8 |
| `/api/tasks/5ee272e1-75a3-4498-895c-18987936062a/bids/d057cca9-5e40-4073-8faf-90a28b67d409/accept` | 1 | 19 | 19 | 19 |
| `/api/tasks/5ee272e1-75a3-4498-895c-18987936062a/deliver` | 2 | 15 | 20 | 20 |
| `/api/tasks/5ee272e1-75a3-4498-895c-18987936062a/rate` | 2 | 11 | 11 | 11 |
| `/api/tasks/5ee272e1-75a3-4498-895c-18987936062a/revision` | 1 | 19 | 19 | 19 |
| `/api/tasks/5fdd79d4-a443-4d75-a4c8-d423eb161e35/approve` | 1 | 10 | 10 | 10 |
| `/api/tasks/5fdd79d4-a443-4d75-a4c8-d423eb161e35/bids` | 1 | 10 | 10 | 10 |
| `/api/tasks/5fdd79d4-a443-4d75-a4c8-d423eb161e35/bids/9265f5ec-ebff-4235-90ef-92b8d486a17a/accept` | 1 | 9 | 9 | 9 |
| `/api/tasks/5fdd79d4-a443-4d75-a4c8-d423eb161e35/deliver` | 1 | 9 | 9 | 9 |
| `/api/tasks/5fdd79d4-a443-4d75-a4c8-d423eb161e35/rate` | 2 | 12 | 12 | 12 |
| `/api/tasks/63dceb62-16c7-4ba5-b320-e2274668776a/bids` | 1 | 10 | 10 | 10 |
| `/api/tasks/656435aa-f8ec-4d52-aa4e-49bbe81d57c9/approve` | 1 | 10 | 10 | 10 |
| `/api/tasks/656435aa-f8ec-4d52-aa4e-49bbe81d57c9/bids` | 1 | 9 | 9 | 9 |
| `/api/tasks/656435aa-f8ec-4d52-aa4e-49bbe81d57c9/bids/803989c7-c469-4ec0-91c4-4adc6d8c61e9/accept` | 1 | 11 | 11 | 11 |
| `/api/tasks/656435aa-f8ec-4d52-aa4e-49bbe81d57c9/deliver` | 1 | 19 | 19 | 19 |
| `/api/tasks/656435aa-f8ec-4d52-aa4e-49bbe81d57c9/rate` | 2 | 11 | 11 | 11 |
| `/api/tasks/67194ec1-6ac8-4246-aa5c-65e92e8b4d65/approve` | 1 | 10 | 10 | 10 |
| `/api/tasks/67194ec1-6ac8-4246-aa5c-65e92e8b4d65/bids` | 1 | 9 | 9 | 9 |
| `/api/tasks/67194ec1-6ac8-4246-aa5c-65e92e8b4d65/bids/e8ed2b89-edc3-4858-9179-32cf4c02aa0d/accept` | 1 | 9 | 9 | 9 |
| `/api/tasks/67194ec1-6ac8-4246-aa5c-65e92e8b4d65/deliver` | 2 | 15 | 20 | 20 |
| `/api/tasks/67194ec1-6ac8-4246-aa5c-65e92e8b4d65/rate` | 2 | 11 | 11 | 11 |
| `/api/tasks/67194ec1-6ac8-4246-aa5c-65e92e8b4d65/revision` | 1 | 14 | 14 | 14 |
| `/api/tasks/6872f35b-9912-4a63-acc8-133581ceb06a/approve` | 1 | 19 | 19 | 19 |
| `/api/tasks/6872f35b-9912-4a63-acc8-133581ceb06a/bids` | 1 | 9 | 9 | 9 |
| `/api/tasks/6872f35b-9912-4a63-acc8-133581ceb06a/bids/82f73045-f78c-4a92-be3e-c2f6cfb1a847/accept` | 1 | 10 | 10 | 10 |
| `/api/tasks/6872f35b-9912-4a63-acc8-133581ceb06a/deliver` | 1 | 9 | 9 | 9 |
| `/api/tasks/6872f35b-9912-4a63-acc8-133581ceb06a/rate` | 2 | 12 | 13 | 13 |
| `/api/tasks/69b5f63e-b444-4b88-ad36-0351f2c4ff10/approve` | 1 | 18 | 18 | 18 |
| `/api/tasks/69b5f63e-b444-4b88-ad36-0351f2c4ff10/bids` | 2 | 9 | 9 | 9 |
| `/api/tasks/69b5f63e-b444-4b88-ad36-0351f2c4ff10/bids/94749711-7b3d-4411-bff5-4402a78b7d6b/accept` | 1 | 10 | 10 | 10 |
| `/api/tasks/69b5f63e-b444-4b88-ad36-0351f2c4ff10/bids/bc238244-f420-413f-bc7e-de1460b1d55b/reject` | 1 | 3 | 3 | 3 |
| `/api/tasks/69b5f63e-b444-4b88-ad36-0351f2c4ff10/deliver` | 2 | 19 | 19 | 19 |
| `/api/tasks/69b5f63e-b444-4b88-ad36-0351f2c4ff10/rate` | 2 | 13 | 14 | 14 |
| `/api/tasks/69b5f63e-b444-4b88-ad36-0351f2c4ff10/revision` | 1 | 18 | 18 | 18 |
| `/api/tasks/6ba95d54-2b4a-4ada-8b6e-0dbdf471849f/approve` | 1 | 18 | 18 | 18 |
| `/api/tasks/6ba95d54-2b4a-4ada-8b6e-0dbdf471849f/bids` | 1 | 9 | 9 | 9 |
| `/api/tasks/6ba95d54-2b4a-4ada-8b6e-0dbdf471849f/bids/e30a81a3-efe4-4eee-8eaa-5b52adcf0b1a/accept` | 1 | 9 | 9 | 9 |
| `/api/tasks/6ba95d54-2b4a-4ada-8b6e-0dbdf471849f/deliver` | 1 | 9 | 9 | 9 |
| `/api/tasks/6ba95d54-2b4a-4ada-8b6e-0dbdf471849f/rate` | 2 | 11 | 12 | 12 |
| `/api/tasks/6e831622-2a1a-4c33-a000-4610609a795c/approve` | 1 | 18 | 18 | 18 |
| `/api/tasks/6e831622-2a1a-4c33-a000-4610609a795c/bids` | 1 | 8 | 8 | 8 |
| `/api/tasks/6e831622-2a1a-4c33-a000-4610609a795c/bids/5c854196-9066-4167-ba4a-b960698e311e/accept` | 1 | 12 | 12 | 12 |
| `/api/tasks/6e831622-2a1a-4c33-a000-4610609a795c/deliver` | 2 | 14 | 19 | 19 |
| `/api/tasks/6e831622-2a1a-4c33-a000-4610609a795c/rate` | 2 | 16 | 22 | 22 |
| `/api/tasks/6e831622-2a1a-4c33-a000-4610609a795c/revision` | 1 | 18 | 18 | 18 |
| `/api/tasks/6f8b54bf-6e08-49db-803c-41703ca1d9ab/bids` | 1 | 9 | 9 | 9 |
| `/api/tasks/71350fc3-2a6c-4059-bdce-cdd737cae6fe/approve` | 1 | 18 | 18 | 18 |
| `/api/tasks/71350fc3-2a6c-4059-bdce-cdd737cae6fe/bids` | 1 | 9 | 9 | 9 |
| `/api/tasks/71350fc3-2a6c-4059-bdce-cdd737cae6fe/bids/85fcf070-a165-46ec-b9c4-f704a93b459c/accept` | 1 | 10 | 10 | 10 |
| `/api/tasks/71350fc3-2a6c-4059-bdce-cdd737cae6fe/deliver` | 1 | 9 | 9 | 9 |
| `/api/tasks/71350fc3-2a6c-4059-bdce-cdd737cae6fe/rate` | 2 | 11 | 11 | 11 |
| `/api/tasks/7564ac0c-657d-41a1-a9eb-610576103dbc/approve` | 1 | 19 | 19 | 19 |
| `/api/tasks/7564ac0c-657d-41a1-a9eb-610576103dbc/bids` | 1 | 8 | 8 | 8 |
| `/api/tasks/7564ac0c-657d-41a1-a9eb-610576103dbc/bids/e49784f0-2b68-4cc8-ab32-45b004a0cc7a/accept` | 1 | 12 | 12 | 12 |
| `/api/tasks/7564ac0c-657d-41a1-a9eb-610576103dbc/deliver` | 1 | 10 | 10 | 10 |
| `/api/tasks/7564ac0c-657d-41a1-a9eb-610576103dbc/rate` | 2 | 12 | 12 | 12 |
| `/api/tasks/788b970f-82df-4344-8554-71366994efbe/bids` | 1 | 9 | 9 | 9 |
| `/api/tasks/79309623-9f2a-450f-9c8f-9528e523a0c9/approve` | 1 | 19 | 19 | 19 |
| `/api/tasks/79309623-9f2a-450f-9c8f-9528e523a0c9/bids` | 1 | 9 | 9 | 9 |
| `/api/tasks/79309623-9f2a-450f-9c8f-9528e523a0c9/bids/cbe360e0-da7e-4853-8516-05fe1edb48da/accept` | 1 | 9 | 9 | 9 |
| `/api/tasks/79309623-9f2a-450f-9c8f-9528e523a0c9/deliver` | 2 | 11 | 13 | 13 |
| `/api/tasks/79309623-9f2a-450f-9c8f-9528e523a0c9/rate` | 2 | 11 | 12 | 12 |
| `/api/tasks/79309623-9f2a-450f-9c8f-9528e523a0c9/revision` | 1 | 16 | 16 | 16 |
| `/api/tasks/7b8db407-af6d-4686-b7c0-ae971da4accc/bids` | 1 | 9 | 9 | 9 |
| `/api/tasks/7c4c4b70-2fc4-4144-94e3-6e647303b24d/bids` | 1 | 10 | 10 | 10 |
| `/api/tasks/7de8bd0e-95da-487b-a992-b9755f6301d2/approve` | 1 | 20 | 20 | 20 |
| `/api/tasks/7de8bd0e-95da-487b-a992-b9755f6301d2/bids` | 1 | 8 | 8 | 8 |
| `/api/tasks/7de8bd0e-95da-487b-a992-b9755f6301d2/bids/6bfac0f5-54fa-4018-9536-f1a64f59cbb3/accept` | 1 | 9 | 9 | 9 |
| `/api/tasks/7de8bd0e-95da-487b-a992-b9755f6301d2/deliver` | 2 | 15 | 19 | 19 |
| `/api/tasks/7de8bd0e-95da-487b-a992-b9755f6301d2/rate` | 2 | 11 | 11 | 11 |
| `/api/tasks/7de8bd0e-95da-487b-a992-b9755f6301d2/revision` | 1 | 19 | 19 | 19 |
| `/api/tasks/80196d85-e6f7-42e1-8ccd-d00304a72441/approve` | 1 | 20 | 20 | 20 |
| `/api/tasks/80196d85-e6f7-42e1-8ccd-d00304a72441/bids` | 1 | 11 | 11 | 11 |
| `/api/tasks/80196d85-e6f7-42e1-8ccd-d00304a72441/bids/6964dbcf-331a-4d93-a42e-26fe0b0b5ab9/accept` | 1 | 12 | 12 | 12 |
| `/api/tasks/80196d85-e6f7-42e1-8ccd-d00304a72441/deliver` | 1 | 9 | 9 | 9 |
| `/api/tasks/80196d85-e6f7-42e1-8ccd-d00304a72441/rate` | 2 | 13 | 14 | 14 |
| `/api/tasks/808a92c4-0603-4aee-b1b5-615daa63de9c/bids` | 1 | 9 | 9 | 9 |
| `/api/tasks/80ba31e9-f5cd-4ccb-a7c6-a82fcb3f1f78/approve` | 1 | 19 | 19 | 19 |
| `/api/tasks/80ba31e9-f5cd-4ccb-a7c6-a82fcb3f1f78/bids` | 1 | 9 | 9 | 9 |
| `/api/tasks/80ba31e9-f5cd-4ccb-a7c6-a82fcb3f1f78/bids/28d99957-b55e-49fc-b9d2-bd6f88f459d4/accept` | 1 | 18 | 18 | 18 |
| `/api/tasks/80ba31e9-f5cd-4ccb-a7c6-a82fcb3f1f78/deliver` | 2 | 14 | 19 | 19 |
| `/api/tasks/80ba31e9-f5cd-4ccb-a7c6-a82fcb3f1f78/rate` | 2 | 11 | 11 | 11 |
| `/api/tasks/80ba31e9-f5cd-4ccb-a7c6-a82fcb3f1f78/revision` | 1 | 19 | 19 | 19 |
| `/api/tasks/81e840e0-b724-42e0-8fcd-3c721351abb2/bids` | 1 | 8 | 8 | 8 |
| `/api/tasks/83d02da2-fa1f-4a7d-a9c9-f6649be81de7/bids` | 1 | 8 | 8 | 8 |
| `/api/tasks/83d02da2-fa1f-4a7d-a9c9-f6649be81de7/bids/4e0c6a7b-a7e8-4bce-a174-1a6967eb57f4/accept` | 1 | 10 | 10 | 10 |
| `/api/tasks/83d02da2-fa1f-4a7d-a9c9-f6649be81de7/deliver` | 1 | 11 | 11 | 11 |
| `/api/tasks/83d02da2-fa1f-4a7d-a9c9-f6649be81de7/dispute` | 1 | 21 | 21 | 21 |
| `/api/tasks/846f4fcb-f52d-47e1-beda-8ca6e3c14449/approve` | 1 | 20 | 20 | 20 |
| `/api/tasks/846f4fcb-f52d-47e1-beda-8ca6e3c14449/bids` | 1 | 18 | 18 | 18 |
| `/api/tasks/846f4fcb-f52d-47e1-beda-8ca6e3c14449/bids/697f2c2b-1ed2-4063-8863-447a1928ca4b/accept` | 1 | 9 | 9 | 9 |
| `/api/tasks/846f4fcb-f52d-47e1-beda-8ca6e3c14449/deliver` | 1 | 19 | 19 | 19 |
| `/api/tasks/846f4fcb-f52d-47e1-beda-8ca6e3c14449/rate` | 2 | 11 | 11 | 11 |
| `/api/tasks/8a0b2995-bd98-4b15-a780-690f4a5327ce/bids` | 1 | 9 | 9 | 9 |
| `/api/tasks/8a0b2995-bd98-4b15-a780-690f4a5327ce/bids/a227c9ce-47c5-4abb-841e-d3783a9522f7/accept` | 1 | 10 | 10 | 10 |
| `/api/tasks/8a0b2995-bd98-4b15-a780-690f4a5327ce/deliver` | 1 | 9 | 9 | 9 |
| `/api/tasks/8a0b2995-bd98-4b15-a780-690f4a5327ce/dispute` | 1 | 11 | 11 | 11 |
| `/api/tasks/8ca16f7e-d4bb-4d64-800a-50c4c0aaa055/approve` | 1 | 19 | 19 | 19 |
| `/api/tasks/8ca16f7e-d4bb-4d64-800a-50c4c0aaa055/bids` | 1 | 10 | 10 | 10 |
| `/api/tasks/8ca16f7e-d4bb-4d64-800a-50c4c0aaa055/bids/5926ff91-4506-4cfa-af87-54e6e23e6935/accept` | 1 | 13 | 13 | 13 |
| `/api/tasks/8ca16f7e-d4bb-4d64-800a-50c4c0aaa055/deliver` | 1 | 10 | 10 | 10 |
| `/api/tasks/8ca16f7e-d4bb-4d64-800a-50c4c0aaa055/rate` | 2 | 16 | 22 | 22 |
| `/api/tasks/8d454602-c7cc-4168-9eb8-0b0d3b1f741c/bids` | 1 | 11 | 11 | 11 |
| `/api/tasks/8d4808ff-dc90-4774-b3a5-0acb1d88cce3/bids` | 1 | 11 | 11 | 11 |
| `/api/tasks/8e218a85-8732-4a0a-855b-a49a9205a0c3/approve` | 1 | 9 | 9 | 9 |
| `/api/tasks/8e218a85-8732-4a0a-855b-a49a9205a0c3/bids` | 1 | 9 | 9 | 9 |
| `/api/tasks/8e218a85-8732-4a0a-855b-a49a9205a0c3/bids/f3b8f037-666c-4450-9db6-6a6b540a29cd/accept` | 1 | 10 | 10 | 10 |
| `/api/tasks/8e218a85-8732-4a0a-855b-a49a9205a0c3/deliver` | 2 | 15 | 19 | 19 |
| `/api/tasks/8e218a85-8732-4a0a-855b-a49a9205a0c3/rate` | 2 | 11 | 11 | 11 |
| `/api/tasks/8e218a85-8732-4a0a-855b-a49a9205a0c3/revision` | 1 | 19 | 19 | 19 |
| `/api/tasks/90ba13f4-3eca-4376-b6f7-8000df2b77cf/approve` | 1 | 18 | 18 | 18 |
| `/api/tasks/90ba13f4-3eca-4376-b6f7-8000df2b77cf/bids` | 1 | 10 | 10 | 10 |
| `/api/tasks/90ba13f4-3eca-4376-b6f7-8000df2b77cf/bids/2bf5bb47-53e5-4702-a7e7-5731a671858d/accept` | 1 | 10 | 10 | 10 |
| `/api/tasks/90ba13f4-3eca-4376-b6f7-8000df2b77cf/deliver` | 2 | 14 | 19 | 19 |
| `/api/tasks/90ba13f4-3eca-4376-b6f7-8000df2b77cf/rate` | 2 | 11 | 11 | 11 |
| `/api/tasks/90ba13f4-3eca-4376-b6f7-8000df2b77cf/revision` | 1 | 18 | 18 | 18 |
| `/api/tasks/92183ef8-2dce-49ed-b8ec-b019ccc2ef6d/approve` | 1 | 19 | 19 | 19 |
| `/api/tasks/92183ef8-2dce-49ed-b8ec-b019ccc2ef6d/bids` | 1 | 18 | 18 | 18 |
| `/api/tasks/92183ef8-2dce-49ed-b8ec-b019ccc2ef6d/bids/28e503b4-e89d-4cdc-a680-d75fda4b7a20/accept` | 1 | 11 | 11 | 11 |
| `/api/tasks/92183ef8-2dce-49ed-b8ec-b019ccc2ef6d/deliver` | 1 | 9 | 9 | 9 |
| `/api/tasks/92183ef8-2dce-49ed-b8ec-b019ccc2ef6d/rate` | 2 | 11 | 11 | 11 |
| `/api/tasks/92f017da-9a5f-473d-a5fc-e9dd9e982516/bids` | 1 | 9 | 9 | 9 |
| `/api/tasks/956bfa04-6ce4-4c1c-b1fd-2f1946281291/approve` | 1 | 18 | 18 | 18 |
| `/api/tasks/956bfa04-6ce4-4c1c-b1fd-2f1946281291/bids` | 1 | 9 | 9 | 9 |
| `/api/tasks/956bfa04-6ce4-4c1c-b1fd-2f1946281291/bids/aed84746-c294-4321-99ed-833b1ae0c083/accept` | 1 | 10 | 10 | 10 |
| `/api/tasks/956bfa04-6ce4-4c1c-b1fd-2f1946281291/deliver` | 1 | 9 | 9 | 9 |
| `/api/tasks/956bfa04-6ce4-4c1c-b1fd-2f1946281291/rate` | 2 | 11 | 11 | 11 |
| `/api/tasks/975c097a-5008-4dfe-a7f0-d212d2955c2b/approve` | 1 | 18 | 18 | 18 |
| `/api/tasks/975c097a-5008-4dfe-a7f0-d212d2955c2b/bids` | 1 | 8 | 8 | 8 |
| `/api/tasks/975c097a-5008-4dfe-a7f0-d212d2955c2b/bids/2d32e5ec-1172-4956-8348-36ba0f66e268/accept` | 1 | 9 | 9 | 9 |
| `/api/tasks/975c097a-5008-4dfe-a7f0-d212d2955c2b/deliver` | 1 | 9 | 9 | 9 |
| `/api/tasks/975c097a-5008-4dfe-a7f0-d212d2955c2b/rate` | 2 | 16 | 21 | 21 |
| `/api/tasks/99936f8e-f8e8-4e32-9d1a-4359aab47a56/bids` | 1 | 10 | 10 | 10 |
| `/api/tasks/99936f8e-f8e8-4e32-9d1a-4359aab47a56/bids/60a1894e-5d6f-40dc-9929-fff8cb81f7c1/accept` | 1 | 26 | 26 | 26 |
| `/api/tasks/99936f8e-f8e8-4e32-9d1a-4359aab47a56/deliver` | 1 | 9 | 9 | 9 |
| `/api/tasks/99936f8e-f8e8-4e32-9d1a-4359aab47a56/dispute` | 1 | 11 | 11 | 11 |
| `/api/tasks/9b936739-5f53-4234-8072-6376fb369893/bids` | 1 | 17 | 17 | 17 |
| `/api/tasks/9d727304-d94b-464d-a7f2-b0539a96481d/approve` | 1 | 10 | 10 | 10 |
| `/api/tasks/9d727304-d94b-464d-a7f2-b0539a96481d/bids` | 1 | 9 | 9 | 9 |
| `/api/tasks/9d727304-d94b-464d-a7f2-b0539a96481d/bids/1349015a-a618-4106-8332-2d9fa2ac00dc/accept` | 1 | 9 | 9 | 9 |
| `/api/tasks/9d727304-d94b-464d-a7f2-b0539a96481d/deliver` | 1 | 9 | 9 | 9 |
| `/api/tasks/9d727304-d94b-464d-a7f2-b0539a96481d/rate` | 2 | 16 | 21 | 21 |
| `/api/tasks/a172dd97-b2b3-4acb-8c47-03f7f137fb70/approve` | 1 | 18 | 18 | 18 |
| `/api/tasks/a172dd97-b2b3-4acb-8c47-03f7f137fb70/bids` | 1 | 9 | 9 | 9 |
| `/api/tasks/a172dd97-b2b3-4acb-8c47-03f7f137fb70/bids/4c77097a-eda4-42eb-9796-03ecbc810c9a/accept` | 1 | 9 | 9 | 9 |
| `/api/tasks/a172dd97-b2b3-4acb-8c47-03f7f137fb70/deliver` | 2 | 14 | 19 | 19 |
| `/api/tasks/a172dd97-b2b3-4acb-8c47-03f7f137fb70/rate` | 2 | 11 | 11 | 11 |
| `/api/tasks/a172dd97-b2b3-4acb-8c47-03f7f137fb70/revision` | 1 | 19 | 19 | 19 |
| `/api/tasks/a2050dac-117b-434d-8289-817591af4336/bids` | 1 | 18 | 18 | 18 |
| `/api/tasks/a2050dac-117b-434d-8289-817591af4336/bids/f064afb2-d1db-4e28-848e-7adeeafe3292/accept` | 1 | 10 | 10 | 10 |
| `/api/tasks/a2050dac-117b-434d-8289-817591af4336/deliver` | 1 | 9 | 9 | 9 |
| `/api/tasks/a21193df-d3da-422d-9980-357a3ebf7065/approve` | 1 | 19 | 19 | 19 |
| `/api/tasks/a21193df-d3da-422d-9980-357a3ebf7065/bids` | 1 | 9 | 9 | 9 |
| `/api/tasks/a21193df-d3da-422d-9980-357a3ebf7065/bids/03332e97-f90a-408c-b570-08f1bd6e97d4/accept` | 1 | 10 | 10 | 10 |
| `/api/tasks/a21193df-d3da-422d-9980-357a3ebf7065/deliver` | 1 | 10 | 10 | 10 |
| `/api/tasks/a21193df-d3da-422d-9980-357a3ebf7065/rate` | 2 | 16 | 22 | 22 |
| `/api/tasks/a27cca36-edad-4d9c-81c5-25c52a800060/approve` | 1 | 10 | 10 | 10 |
| `/api/tasks/a27cca36-edad-4d9c-81c5-25c52a800060/bids` | 1 | 9 | 9 | 9 |
| `/api/tasks/a27cca36-edad-4d9c-81c5-25c52a800060/bids/6eef0729-28d4-4485-a884-b6ae9910c9c0/accept` | 1 | 10 | 10 | 10 |
| `/api/tasks/a27cca36-edad-4d9c-81c5-25c52a800060/deliver` | 1 | 9 | 9 | 9 |
| `/api/tasks/a27cca36-edad-4d9c-81c5-25c52a800060/rate` | 2 | 11 | 11 | 11 |
| `/api/tasks/a35b4075-35da-4836-b45c-2193178cfe52/approve` | 1 | 19 | 19 | 19 |
| `/api/tasks/a35b4075-35da-4836-b45c-2193178cfe52/bids` | 1 | 9 | 9 | 9 |
| `/api/tasks/a35b4075-35da-4836-b45c-2193178cfe52/bids/f8d33e78-503a-4b21-ab26-bf379f504be4/accept` | 1 | 9 | 9 | 9 |
| `/api/tasks/a35b4075-35da-4836-b45c-2193178cfe52/deliver` | 2 | 14 | 19 | 19 |
| `/api/tasks/a35b4075-35da-4836-b45c-2193178cfe52/rate` | 2 | 16 | 21 | 21 |
| `/api/tasks/a35b4075-35da-4836-b45c-2193178cfe52/revision` | 1 | 9 | 9 | 9 |
| `/api/tasks/a36869cf-51d4-4714-8eef-cdda8605f994/bids` | 1 | 8 | 8 | 8 |
| `/api/tasks/a36869cf-51d4-4714-8eef-cdda8605f994/bids/765ebe7c-45fb-4d4c-b530-13caed074e65/accept` | 1 | 9 | 9 | 9 |
| `/api/tasks/a36869cf-51d4-4714-8eef-cdda8605f994/deliver` | 1 | 8 | 8 | 8 |
| `/api/tasks/a42c649e-a860-434a-b631-d10890690dc4/bids` | 1 | 9 | 9 | 9 |
| `/api/tasks/a60c0ada-bf86-442e-ba7f-ae6774c6c60f/approve` | 1 | 19 | 19 | 19 |
| `/api/tasks/a60c0ada-bf86-442e-ba7f-ae6774c6c60f/bids` | 1 | 9 | 9 | 9 |
| `/api/tasks/a60c0ada-bf86-442e-ba7f-ae6774c6c60f/bids/97b03fe3-5551-4858-83c4-4c29862bb846/accept` | 1 | 10 | 10 | 10 |
| `/api/tasks/a60c0ada-bf86-442e-ba7f-ae6774c6c60f/deliver` | 1 | 9 | 9 | 9 |
| `/api/tasks/a60c0ada-bf86-442e-ba7f-ae6774c6c60f/rate` | 2 | 17 | 22 | 22 |
| `/api/tasks/a7fe9b7d-78e2-4f81-9f73-e724e30ee55c/bids` | 1 | 9 | 9 | 9 |
| `/api/tasks/a83a2957-a478-4eb7-9743-2edc982288cc/bids` | 1 | 9 | 9 | 9 |
| `/api/tasks/a83a2957-a478-4eb7-9743-2edc982288cc/bids/469f8578-1d0c-497c-8e70-9c2bf79d5205/accept` | 1 | 9 | 9 | 9 |
| `/api/tasks/a83a2957-a478-4eb7-9743-2edc982288cc/deliver` | 1 | 10 | 10 | 10 |
| `/api/tasks/a9ea1961-b48d-484e-8509-766296509ca6/bids` | 1 | 10 | 10 | 10 |
| `/api/tasks/a9ea1961-b48d-484e-8509-766296509ca6/bids/3825d13e-cdb4-4413-b26c-a4d713bf978f/accept` | 1 | 10 | 10 | 10 |
| `/api/tasks/a9ea1961-b48d-484e-8509-766296509ca6/deliver` | 1 | 20 | 20 | 20 |
| `/api/tasks/a9ea1961-b48d-484e-8509-766296509ca6/dispute` | 1 | 21 | 21 | 21 |
| `/api/tasks/aed73bf2-2817-45c6-a53a-a9b3cf3d42f5/bids` | 1 | 8 | 8 | 8 |
| `/api/tasks/analyze-autonomous-agents-user-feedback-1c13ee17/bids` | 1 | 3 | 3 | 3 |
| `/api/tasks/analyze-autonomous-agents-user-feedback-f13347fc/bids` | 1 | 2 | 2 | 2 |
| `/api/tasks/analyze-containerization-user-feedback-4b7dd4a2/bids` | 1 | 4 | 4 | 4 |
| `/api/tasks/analyze-cross-chain-user-feedback-66ce2fb4/bids` | 1 | 3 | 3 | 3 |
| `/api/tasks/analyze-cross-chain-user-feedback-d2e06217/bids` | 1 | 4 | 4 | 4 |
| `/api/tasks/analyze-cross-chain-user-feedback-e4aed831/bids` | 1 | 2 | 2 | 2 |
| `/api/tasks/analyze-dapp-user-feedback-a737df12/bids` | 1 | 4 | 4 | 4 |
| `/api/tasks/analyze-e-commerce-user-feedback-706052b2/bids` | 1 | 3 | 3 | 3 |
| `/api/tasks/analyze-react-frontend-user-feedback-b7fccb1e/bids` | 1 | 3 | 3 | 3 |
| `/api/tasks/analyze-react-frontend-user-feedback-da5c6a6b/bids` | 1 | 3 | 3 | 3 |
| `/api/tasks/analyze-rust-backend-user-feedback-6fc43e1b/bids` | 1 | 3 | 3 | 3 |
| `/api/tasks/automate-api-gateway-workflow-c1d52b1a/bids` | 1 | 3 | 3 | 3 |
| `/api/tasks/automate-blockchain-workflow-63b70bef/bids` | 1 | 4 | 4 | 4 |
| `/api/tasks/automate-ckb-workflow-28aa0ad1/bids` | 1 | 3 | 3 | 3 |
| `/api/tasks/automate-dapp-workflow-f57a0215/bids` | 1 | 3 | 3 | 3 |
| `/api/tasks/automate-rust-backend-workflow-807c3269/bids` | 1 | 4 | 4 | 4 |
| `/api/tasks/b1dfa3f9-96c9-49d1-a921-adc5c701a59c/approve` | 1 | 19 | 19 | 19 |
| `/api/tasks/b1dfa3f9-96c9-49d1-a921-adc5c701a59c/bids` | 1 | 10 | 10 | 10 |
| `/api/tasks/b1dfa3f9-96c9-49d1-a921-adc5c701a59c/bids/7c700f62-c3e1-4990-8bd2-c51c513db3e2/accept` | 1 | 9 | 9 | 9 |
| `/api/tasks/b1dfa3f9-96c9-49d1-a921-adc5c701a59c/deliver` | 1 | 19 | 19 | 19 |
| `/api/tasks/b1dfa3f9-96c9-49d1-a921-adc5c701a59c/rate` | 2 | 16 | 22 | 22 |
| `/api/tasks/b2dbd8ca-910f-4e53-be44-59d2161ab7ce/approve` | 1 | 10 | 10 | 10 |
| `/api/tasks/b2dbd8ca-910f-4e53-be44-59d2161ab7ce/bids` | 2 | 5 | 8 | 8 |
| `/api/tasks/b2dbd8ca-910f-4e53-be44-59d2161ab7ce/bids/8bb7431c-b89f-4e0e-bfee-011691621262/accept` | 1 | 9 | 9 | 9 |
| `/api/tasks/b2dbd8ca-910f-4e53-be44-59d2161ab7ce/deliver` | 2 | 19 | 20 | 20 |
| `/api/tasks/b2dbd8ca-910f-4e53-be44-59d2161ab7ce/rate` | 2 | 13 | 14 | 14 |
| `/api/tasks/b2dbd8ca-910f-4e53-be44-59d2161ab7ce/revision` | 1 | 19 | 19 | 19 |
| `/api/tasks/b49b7c37-2063-45cc-90f3-0986ca6b1204/approve` | 1 | 21 | 21 | 21 |
| `/api/tasks/b49b7c37-2063-45cc-90f3-0986ca6b1204/bids` | 1 | 9 | 9 | 9 |
| `/api/tasks/b49b7c37-2063-45cc-90f3-0986ca6b1204/bids/92c0df57-9afc-41e0-8a7d-6a82cd42265c/accept` | 1 | 12 | 12 | 12 |
| `/api/tasks/b49b7c37-2063-45cc-90f3-0986ca6b1204/deliver` | 1 | 11 | 11 | 11 |
| `/api/tasks/b49b7c37-2063-45cc-90f3-0986ca6b1204/rate` | 2 | 12 | 13 | 13 |
| `/api/tasks/b4ed6a7a-10fe-4ad9-b814-548b4ed56e0d/approve` | 1 | 18 | 18 | 18 |
| `/api/tasks/b4ed6a7a-10fe-4ad9-b814-548b4ed56e0d/bids` | 1 | 8 | 8 | 8 |
| `/api/tasks/b4ed6a7a-10fe-4ad9-b814-548b4ed56e0d/bids/fa120bfa-362d-496c-82f0-7301dd754658/accept` | 1 | 19 | 19 | 19 |
| `/api/tasks/b4ed6a7a-10fe-4ad9-b814-548b4ed56e0d/deliver` | 1 | 9 | 9 | 9 |
| `/api/tasks/b4ed6a7a-10fe-4ad9-b814-548b4ed56e0d/rate` | 2 | 11 | 11 | 11 |
| `/api/tasks/b5b0dd50-776d-4b2c-ad15-b028f36b34a7/bids` | 1 | 8 | 8 | 8 |
| `/api/tasks/bb5b2d99-7bed-42e9-8d8f-9de8eafb7310/approve` | 1 | 18 | 18 | 18 |
| `/api/tasks/bb5b2d99-7bed-42e9-8d8f-9de8eafb7310/bids` | 1 | 18 | 18 | 18 |
| `/api/tasks/bb5b2d99-7bed-42e9-8d8f-9de8eafb7310/bids/1eb2490f-5a81-457c-b09f-3c4c5e724b02/accept` | 1 | 11 | 11 | 11 |
| `/api/tasks/bb5b2d99-7bed-42e9-8d8f-9de8eafb7310/deliver` | 1 | 9 | 9 | 9 |
| `/api/tasks/bb5b2d99-7bed-42e9-8d8f-9de8eafb7310/rate` | 2 | 11 | 11 | 11 |
| `/api/tasks/bddbd183-ddc5-404a-8f28-9af8c89d2f8a/approve` | 1 | 19 | 19 | 19 |
| `/api/tasks/bddbd183-ddc5-404a-8f28-9af8c89d2f8a/bids` | 1 | 13 | 13 | 13 |
| `/api/tasks/bddbd183-ddc5-404a-8f28-9af8c89d2f8a/bids/e24cc0ba-e981-4166-98e7-38733736a3fa/accept` | 1 | 10 | 10 | 10 |
| `/api/tasks/bddbd183-ddc5-404a-8f28-9af8c89d2f8a/deliver` | 2 | 15 | 20 | 20 |
| `/api/tasks/bddbd183-ddc5-404a-8f28-9af8c89d2f8a/rate` | 2 | 11 | 11 | 11 |
| `/api/tasks/bddbd183-ddc5-404a-8f28-9af8c89d2f8a/revision` | 1 | 19 | 19 | 19 |
| `/api/tasks/bf06f571-1695-4e0a-9f32-34cfe1a12a7c/bids` | 2 | 9 | 9 | 9 |
| `/api/tasks/build-cloud-infrastructure-api-integration-cba466a5/bids` | 1 | 3 | 3 | 3 |
| `/api/tasks/build-cloud-infrastructure-monitoring-dashboard-a38b0cb7/bids` | 1 | 3 | 3 | 3 |
| `/api/tasks/build-containerization-api-integration-a81ad5f0/bids` | 1 | 2 | 2 | 2 |
| `/api/tasks/build-cross-chain-api-integration-0686c315/bids` | 1 | 3 | 3 | 3 |
| `/api/tasks/build-cross-chain-monitoring-dashboard-25292560/bids` | 1 | 2 | 2 | 2 |
| `/api/tasks/build-dapp-monitoring-dashboard-74203061/bids` | 1 | 3 | 3 | 3 |
| `/api/tasks/build-embeddings-api-integration-4ec342dd/bids` | 1 | 4 | 4 | 4 |
| `/api/tasks/build-embeddings-api-integration-610d216f/bids` | 1 | 3 | 3 | 3 |
| `/api/tasks/build-micropayments-monitoring-dashboard-049defa6/bids` | 1 | 3 | 3 | 3 |
| `/api/tasks/build-nervos-monitoring-dashboard-792d5f69/bids` | 1 | 3 | 3 | 3 |
| `/api/tasks/build-rust-backend-api-integration-a1ca5217/bids` | 1 | 3 | 3 | 3 |
| `/api/tasks/build-serverless-api-integration-d5b71f88/bids` | 1 | 3 | 3 | 3 |
| `/api/tasks/build-social-media-api-integration-495e4111/bids` | 1 | 4 | 4 | 4 |
| `/api/tasks/build-supply-chain-monitoring-dashboard-74161619/bids` | 1 | 5 | 5 | 5 |
| `/api/tasks/build-tokenomics-monitoring-dashboard-1bd388c9/bids` | 1 | 3 | 3 | 3 |
| `/api/tasks/build-tokenomics-monitoring-dashboard-b07c3222/bids` | 1 | 4 | 4 | 4 |
| `/api/tasks/build-vector-search-api-integration-18fc1b30/bids` | 1 | 3 | 3 | 3 |
| `/api/tasks/build-web3-api-integration-e3e3c555/bids` | 1 | 3 | 3 | 3 |
| `/api/tasks/c6cb6bcb-13de-4c43-886e-f957a8d59288/bids` | 1 | 8 | 8 | 8 |
| `/api/tasks/c752de30-4b86-42b8-aa56-65e4074d5584/approve` | 1 | 21 | 21 | 21 |
| `/api/tasks/c752de30-4b86-42b8-aa56-65e4074d5584/bids` | 1 | 18 | 18 | 18 |
| `/api/tasks/c752de30-4b86-42b8-aa56-65e4074d5584/bids/ba90e033-7fd7-4eb9-8f36-bff2adc1b48d/accept` | 1 | 18 | 18 | 18 |
| `/api/tasks/c752de30-4b86-42b8-aa56-65e4074d5584/deliver` | 1 | 12 | 12 | 12 |
| `/api/tasks/c752de30-4b86-42b8-aa56-65e4074d5584/rate` | 2 | 11 | 11 | 11 |
| `/api/tasks/c75e9306-ecf0-4775-a505-cfa39aad4037/bids` | 1 | 19 | 19 | 19 |
| `/api/tasks/c7b9f9c2-c6b6-43a2-9a26-3fde06ae7d3d/approve` | 1 | 18 | 18 | 18 |
| `/api/tasks/c7b9f9c2-c6b6-43a2-9a26-3fde06ae7d3d/bids` | 1 | 8 | 8 | 8 |
| `/api/tasks/c7b9f9c2-c6b6-43a2-9a26-3fde06ae7d3d/bids/4f4fb517-2fb5-4507-a593-88496058b155/accept` | 1 | 10 | 10 | 10 |
| `/api/tasks/c7b9f9c2-c6b6-43a2-9a26-3fde06ae7d3d/deliver` | 1 | 10 | 10 | 10 |
| `/api/tasks/c7b9f9c2-c6b6-43a2-9a26-3fde06ae7d3d/rate` | 2 | 11 | 11 | 11 |
| `/api/tasks/c91fc339-26ca-45cb-bcda-ba0e8df74309/bids` | 1 | 19 | 19 | 19 |
| `/api/tasks/c9e07a8a-a083-416f-a7aa-f3b979d79d81/bids` | 1 | 8 | 8 | 8 |
| `/api/tasks/cd42ecd5-f131-41e1-85f7-0788f5c7652e/approve` | 1 | 19 | 19 | 19 |
| `/api/tasks/cd42ecd5-f131-41e1-85f7-0788f5c7652e/bids` | 1 | 9 | 9 | 9 |
| `/api/tasks/cd42ecd5-f131-41e1-85f7-0788f5c7652e/bids/4c1b5cac-ac2f-4626-bea0-6f8ecc191aed/accept` | 1 | 10 | 10 | 10 |
| `/api/tasks/cd42ecd5-f131-41e1-85f7-0788f5c7652e/deliver` | 1 | 9 | 9 | 9 |
| `/api/tasks/cd42ecd5-f131-41e1-85f7-0788f5c7652e/rate` | 2 | 11 | 11 | 11 |
| `/api/tasks/cd6b7531-783d-4a46-8e1d-b4c44ffe5571/approve` | 1 | 18 | 18 | 18 |
| `/api/tasks/cd6b7531-783d-4a46-8e1d-b4c44ffe5571/bids` | 1 | 8 | 8 | 8 |
| `/api/tasks/cd6b7531-783d-4a46-8e1d-b4c44ffe5571/bids/132ba5d4-54ce-423c-800c-b73e5effec0b/accept` | 1 | 11 | 11 | 11 |
| `/api/tasks/cd6b7531-783d-4a46-8e1d-b4c44ffe5571/deliver` | 1 | 9 | 9 | 9 |
| `/api/tasks/cd6b7531-783d-4a46-8e1d-b4c44ffe5571/rate` | 2 | 12 | 13 | 13 |
| `/api/tasks/cebf20bd-3f86-44cf-bab2-3a85f3b911c8/approve` | 1 | 14 | 14 | 14 |
| `/api/tasks/cebf20bd-3f86-44cf-bab2-3a85f3b911c8/bids` | 1 | 9 | 9 | 9 |
| `/api/tasks/cebf20bd-3f86-44cf-bab2-3a85f3b911c8/bids/ee67c457-0c2c-4d2d-b99c-cda1e6c0e901/accept` | 1 | 20 | 20 | 20 |
| `/api/tasks/cebf20bd-3f86-44cf-bab2-3a85f3b911c8/deliver` | 1 | 19 | 19 | 19 |
| `/api/tasks/cebf20bd-3f86-44cf-bab2-3a85f3b911c8/rate` | 2 | 16 | 21 | 21 |
| `/api/tasks/code-review-for-agent-economy-module-452a4865/bids` | 1 | 3 | 3 | 3 |
| `/api/tasks/code-review-for-ci-cd-module-2515efb8/bids` | 1 | 3 | 3 | 3 |
| `/api/tasks/code-review-for-ci-cd-module-2694a9a2/bids` | 1 | 3 | 3 | 3 |
| `/api/tasks/code-review-for-ci-cd-module-a79ae247/bids` | 1 | 3 | 3 | 3 |
| `/api/tasks/code-review-for-ci-cd-module-f9313ed3/bids` | 1 | 2 | 2 | 2 |
| `/api/tasks/code-review-for-ckb-module-593d45a4/bids` | 1 | 3 | 3 | 3 |
| `/api/tasks/code-review-for-e-commerce-module-28b333fa/bids` | 1 | 2 | 2 | 2 |
| `/api/tasks/code-review-for-fintech-module-07fa0e17/bids` | 1 | 4 | 4 | 4 |
| `/api/tasks/code-review-for-serverless-module-b4f7a325/bids` | 1 | 3 | 3 | 3 |
| `/api/tasks/code-review-for-tokenomics-module-16327239/bids` | 1 | 3 | 3 | 3 |
| `/api/tasks/code-review-for-tokenomics-module-2f073943/bids` | 1 | 3 | 3 | 3 |
| `/api/tasks/create-documentation-for-api-gateway-cb56d9b5/bids` | 1 | 3 | 3 | 3 |
| `/api/tasks/create-documentation-for-autonomous-agents-f9826422/bids` | 1 | 3 | 3 | 3 |
| `/api/tasks/create-documentation-for-ci-cd-0cd7f61d/bids` | 1 | 3 | 3 | 3 |
| `/api/tasks/create-documentation-for-cross-chain-9209784d/bids` | 1 | 3 | 3 | 3 |
| `/api/tasks/create-documentation-for-dapp-e06821fb/bids` | 1 | 3 | 3 | 3 |
| `/api/tasks/create-documentation-for-defi-990e131e/bids` | 1 | 3 | 3 | 3 |
| `/api/tasks/create-documentation-for-nft-937eabb4/bids` | 1 | 2 | 2 | 2 |
| `/api/tasks/create-documentation-for-social-media-63c781cb/bids` | 1 | 3 | 3 | 3 |
| `/api/tasks/create-documentation-for-social-media-e7ffbb72/bids` | 1 | 2 | 2 | 2 |
| `/api/tasks/d1319c2a-054b-4c1f-9216-a04f801cac48/bids` | 1 | 9 | 9 | 9 |
| `/api/tasks/d3b1cfcf-2ca6-4ae2-a993-461261e1f9ae/bids` | 1 | 9 | 9 | 9 |
| `/api/tasks/d51c7146-1085-4430-b087-7fafa47ff56b/bids` | 1 | 10 | 10 | 10 |
| `/api/tasks/d6b26db0-5a62-4ce0-b2fa-5e9f06ee9803/approve` | 1 | 19 | 19 | 19 |
| `/api/tasks/d6b26db0-5a62-4ce0-b2fa-5e9f06ee9803/bids` | 1 | 10 | 10 | 10 |
| `/api/tasks/d6b26db0-5a62-4ce0-b2fa-5e9f06ee9803/bids/ca3c8a88-e467-4921-b919-f0b96adb8824/accept` | 1 | 10 | 10 | 10 |
| `/api/tasks/d6b26db0-5a62-4ce0-b2fa-5e9f06ee9803/deliver` | 2 | 14 | 19 | 19 |
| `/api/tasks/d6b26db0-5a62-4ce0-b2fa-5e9f06ee9803/rate` | 2 | 11 | 11 | 11 |
| `/api/tasks/d6b26db0-5a62-4ce0-b2fa-5e9f06ee9803/revision` | 1 | 19 | 19 | 19 |
| `/api/tasks/d9735589-d1a9-492b-8671-ef779cc4ee44/bids` | 1 | 8 | 8 | 8 |
| `/api/tasks/daed11cd-8d26-4027-b223-e9d9a4602d27/approve` | 1 | 18 | 18 | 18 |
| `/api/tasks/daed11cd-8d26-4027-b223-e9d9a4602d27/bids` | 1 | 9 | 9 | 9 |
| `/api/tasks/daed11cd-8d26-4027-b223-e9d9a4602d27/bids/ef4512b7-e7d6-4048-b5f0-33c247e71ff1/accept` | 1 | 9 | 9 | 9 |
| `/api/tasks/daed11cd-8d26-4027-b223-e9d9a4602d27/deliver` | 1 | 8 | 8 | 8 |
| `/api/tasks/daed11cd-8d26-4027-b223-e9d9a4602d27/rate` | 2 | 11 | 11 | 11 |
| `/api/tasks/deploy-autonomous-agents-to-production-54ff7c4e/bids` | 1 | 2 | 2 | 2 |
| `/api/tasks/deploy-cloud-infrastructure-to-production-b2624cac/bids` | 1 | 3 | 3 | 3 |
| `/api/tasks/deploy-fintech-to-production-04164ff4/bids` | 1 | 3 | 3 | 3 |
| `/api/tasks/deploy-layer2-to-production-83c0f502/bids` | 1 | 3 | 3 | 3 |
| `/api/tasks/deploy-micropayments-to-production-d3ddf632/bids` | 1 | 2 | 2 | 2 |
| `/api/tasks/deploy-react-frontend-to-production-cc1a4645/bids` | 1 | 3 | 3 | 3 |
| `/api/tasks/design-ai-ui-mockup-981acfef/bids` | 1 | 2 | 2 | 2 |
| `/api/tasks/design-ai-ui-mockup-b74caf7f/bids` | 1 | 3 | 3 | 3 |
| `/api/tasks/design-containerization-ui-mockup-0dee25d6/bids` | 1 | 3 | 3 | 3 |
| `/api/tasks/design-dao-ui-mockup-69a61756/bids` | 1 | 3 | 3 | 3 |
| `/api/tasks/design-defi-ui-mockup-15451905/bids` | 1 | 3 | 3 | 3 |
| `/api/tasks/design-escrow-systems-ui-mockup-9d27406d/bids` | 1 | 3 | 3 | 3 |
| `/api/tasks/design-react-frontend-ui-mockup-50e7e059/bids` | 1 | 3 | 3 | 3 |
| `/api/tasks/dfd1e021-103e-4b33-ad0b-9634a6a197a9/bids` | 2 | 5 | 9 | 9 |
| `/api/tasks/dfd1e021-103e-4b33-ad0b-9634a6a197a9/cancel` | 1 | 2 | 2 | 2 |
| `/api/tasks/e5de1a5c-ff14-43ce-a035-f3cd1131b759/bids` | 1 | 19 | 19 | 19 |
| `/api/tasks/ef772b86-3241-4581-8b0e-953f8f343b0f/bids` | 2 | 8 | 9 | 9 |
| `/api/tasks/ef772b86-3241-4581-8b0e-953f8f343b0f/bids/0738a914-503f-4c5c-8229-e01120ac4538/reject` | 1 | 3 | 3 | 3 |
| `/api/tasks/ef772b86-3241-4581-8b0e-953f8f343b0f/bids/c28bac3f-8883-4384-abeb-16104d52170d/accept` | 1 | 9 | 9 | 9 |
| `/api/tasks/ef772b86-3241-4581-8b0e-953f8f343b0f/deliver` | 1 | 9 | 9 | 9 |
| `/api/tasks/f71e995d-1868-4511-a402-5f6eb4c84b7f/approve` | 1 | 19 | 19 | 19 |
| `/api/tasks/f71e995d-1868-4511-a402-5f6eb4c84b7f/bids` | 1 | 9 | 9 | 9 |
| `/api/tasks/f71e995d-1868-4511-a402-5f6eb4c84b7f/bids/ef218444-4c2e-4651-b2a1-dd275d34dedb/accept` | 1 | 10 | 10 | 10 |
| `/api/tasks/f71e995d-1868-4511-a402-5f6eb4c84b7f/deliver` | 1 | 9 | 9 | 9 |
| `/api/tasks/f71e995d-1868-4511-a402-5f6eb4c84b7f/rate` | 2 | 12 | 12 | 12 |
| `/api/tasks/f7cc18b6-2bcb-47b2-8694-9a368673f417/approve` | 1 | 19 | 19 | 19 |
| `/api/tasks/f7cc18b6-2bcb-47b2-8694-9a368673f417/bids` | 1 | 9 | 9 | 9 |
| `/api/tasks/f7cc18b6-2bcb-47b2-8694-9a368673f417/bids/4f50951f-c761-40aa-83e6-986625faaba2/accept` | 1 | 9 | 9 | 9 |
| `/api/tasks/f7cc18b6-2bcb-47b2-8694-9a368673f417/deliver` | 1 | 9 | 9 | 9 |
| `/api/tasks/f7cc18b6-2bcb-47b2-8694-9a368673f417/rate` | 2 | 13 | 13 | 13 |
| `/api/tasks/f89463c6-0073-47bb-83dc-fcb4b4a2cfcc/approve` | 1 | 18 | 18 | 18 |
| `/api/tasks/f89463c6-0073-47bb-83dc-fcb4b4a2cfcc/bids` | 1 | 9 | 9 | 9 |
| `/api/tasks/f89463c6-0073-47bb-83dc-fcb4b4a2cfcc/bids/5bf16809-77e3-4097-8ef8-5ae4e597c281/accept` | 1 | 9 | 9 | 9 |
| `/api/tasks/f89463c6-0073-47bb-83dc-fcb4b4a2cfcc/deliver` | 1 | 9 | 9 | 9 |
| `/api/tasks/f89463c6-0073-47bb-83dc-fcb4b4a2cfcc/rate` | 2 | 11 | 11 | 11 |
| `/api/tasks/f8b1aae1-70cb-4182-8def-72ee4da6a2f2/approve` | 1 | 20 | 20 | 20 |
| `/api/tasks/f8b1aae1-70cb-4182-8def-72ee4da6a2f2/bids` | 1 | 17 | 17 | 17 |
| `/api/tasks/f8b1aae1-70cb-4182-8def-72ee4da6a2f2/bids/6c4a2e32-d634-4d5f-9d7d-b75fa88ff00b/accept` | 1 | 9 | 9 | 9 |
| `/api/tasks/f8b1aae1-70cb-4182-8def-72ee4da6a2f2/deliver` | 1 | 10 | 10 | 10 |
| `/api/tasks/f8b1aae1-70cb-4182-8def-72ee4da6a2f2/rate` | 2 | 16 | 21 | 21 |
| `/api/tasks/fa16e72e-497c-47de-91a6-fc1e5e33b5b4/approve` | 1 | 19 | 19 | 19 |
| `/api/tasks/fa16e72e-497c-47de-91a6-fc1e5e33b5b4/bids` | 1 | 9 | 9 | 9 |
| `/api/tasks/fa16e72e-497c-47de-91a6-fc1e5e33b5b4/bids/8d35d647-85a8-4b54-9e93-89a5a55ba786/accept` | 1 | 19 | 19 | 19 |
| `/api/tasks/fa16e72e-497c-47de-91a6-fc1e5e33b5b4/deliver` | 1 | 9 | 9 | 9 |
| `/api/tasks/fa16e72e-497c-47de-91a6-fc1e5e33b5b4/rate` | 2 | 11 | 11 | 11 |
| `/api/tasks/fb3f7c67-68d1-4dd2-afec-c891f7879089/bids` | 1 | 8 | 8 | 8 |
| `/api/tasks/fcc6b049-1e37-4a49-bfd6-abd06abaf30d/approve` | 1 | 19 | 19 | 19 |
| `/api/tasks/fcc6b049-1e37-4a49-bfd6-abd06abaf30d/bids` | 1 | 8 | 8 | 8 |
| `/api/tasks/fcc6b049-1e37-4a49-bfd6-abd06abaf30d/bids/7a24ef48-3c6c-4e77-8579-efe31d298183/accept` | 1 | 10 | 10 | 10 |
| `/api/tasks/fcc6b049-1e37-4a49-bfd6-abd06abaf30d/deliver` | 1 | 10 | 10 | 10 |
| `/api/tasks/fcc6b049-1e37-4a49-bfd6-abd06abaf30d/rate` | 2 | 11 | 11 | 11 |
| `/api/tasks/fe3fdf8b-6494-4e19-b51e-af7f2d23bb5a/bids` | 1 | 9 | 9 | 9 |
| `/api/tasks/nonexistent-task-slug-12345` | 1 | 2 | 2 | 2 |
| `/api/tasks/process-agent-economy-dataset-5f8632f5/bids` | 1 | 3 | 3 | 3 |
| `/api/tasks/process-autonomous-agents-dataset-7b1a0c5c/bids` | 1 | 3 | 3 | 3 |
| `/api/tasks/process-cloud-infrastructure-dataset-1fe0d6b5/bids` | 1 | 3 | 3 | 3 |
| `/api/tasks/process-cloud-infrastructure-dataset-8fde4ddc/bids` | 1 | 3 | 3 | 3 |
| `/api/tasks/process-e-commerce-dataset-9c43da95/bids` | 1 | 4 | 4 | 4 |
| `/api/tasks/process-neural-networks-dataset-0d7bb3df/bids` | 1 | 4 | 4 | 4 |
| `/api/tasks/process-smart-contracts-dataset-51b57019/bids` | 1 | 3 | 3 | 3 |
| `/api/tasks/process-social-media-dataset-09eb9d2c/bids` | 1 | 3 | 3 | 3 |
| `/api/tasks/research-blockchain-market-trends-bcbd1899/bids` | 1 | 3 | 3 | 3 |
| `/api/tasks/research-e-commerce-market-trends-062e8250/bids` | 1 | 3 | 3 | 3 |
| `/api/tasks/research-micropayments-market-trends-b35ea4b9/bids` | 1 | 3 | 3 | 3 |
| `/api/tasks/research-nervos-market-trends-3efdf839/bids` | 1 | 3 | 3 | 3 |
| `/api/tasks/research-social-media-market-trends-630b1979/bids` | 1 | 3 | 3 | 3 |
| `/api/tasks/research-social-media-market-trends-f195f40a/bids` | 1 | 2 | 2 | 2 |
| `/api/tasks/scrape-blockchain-competitor-data-3b6dce7b/bids` | 1 | 3 | 3 | 3 |
| `/api/tasks/scrape-dapp-competitor-data-7949c38a/bids` | 1 | 2 | 2 | 2 |
| `/api/tasks/scrape-e-commerce-competitor-data-afa92375/bids` | 1 | 3 | 3 | 3 |
| `/api/tasks/scrape-machine-learning-competitor-data-45c59a61/bids` | 1 | 3 | 3 | 3 |
| `/api/tasks/scrape-nft-competitor-data-0ef7c22f/bids` | 1 | 4 | 4 | 4 |
| `/api/tasks/scrape-postgresql-competitor-data-13075369/bids` | 1 | 3 | 3 | 3 |
| `/api/tasks/scrape-serverless-competitor-data-92ac1765/bids` | 1 | 3 | 3 | 3 |
| `/api/tasks/scrape-tokenomics-competitor-data-9dac6c71/bids` | 1 | 3 | 3 | 3 |
| `/api/tasks/summarize-cross-chain-quarterly-report-30c17673/bids` | 1 | 3 | 3 | 3 |
| `/api/tasks/summarize-cybersecurity-quarterly-report-d84ccfb9/bids` | 1 | 5 | 5 | 5 |
| `/api/tasks/summarize-fintech-quarterly-report-9aa8f844/bids` | 1 | 3 | 3 | 3 |
| `/api/tasks/summarize-healthcare-data-quarterly-report-1b825a2d/bids` | 1 | 3 | 3 | 3 |
| `/api/tasks/summarize-neural-networks-quarterly-report-4d8e8f78/bids` | 1 | 3 | 3 | 3 |
| `/api/tasks/summarize-nft-quarterly-report-e970b6e6/bids` | 1 | 2 | 2 | 2 |
| `/api/tasks/summarize-serverless-quarterly-report-3de0d4fb/bids` | 1 | 4 | 4 | 4 |
| `/api/tasks/summarize-serverless-quarterly-report-500b638e/bids` | 1 | 3 | 3 | 3 |
| `/api/tasks/summarize-serverless-quarterly-report-65598146/bids` | 1 | 3 | 3 | 3 |
| `/api/tasks/summarize-vector-search-quarterly-report-fcc43cc7/bids` | 1 | 3 | 3 | 3 |
| `/api/tasks/summarize-web3-quarterly-report-cea51ad1/bids` | 1 | 3 | 3 | 3 |
| `/api/tasks/summarize-webhook-system-quarterly-report-65ccc726/bids` | 1 | 3 | 3 | 3 |
| `/api/tasks/translate-blockchain-docs-to-spanish-291c978c/bids` | 1 | 4 | 4 | 4 |
| `/api/tasks/translate-cross-chain-docs-to-spanish-8fda2a9c/bids` | 1 | 3 | 3 | 3 |
| `/api/tasks/translate-cross-chain-docs-to-spanish-cb9b880c/bids` | 1 | 4 | 4 | 4 |
| `/api/tasks/translate-dao-docs-to-spanish-9976e5b9/bids` | 1 | 3 | 3 | 3 |
| `/api/tasks/translate-dapp-docs-to-spanish-51722b7e/bids` | 1 | 3 | 3 | 3 |
| `/api/tasks/translate-defi-docs-to-spanish-7e2aa98a/bids` | 1 | 3 | 3 | 3 |
| `/api/tasks/translate-embeddings-docs-to-spanish-41f54476/bids` | 1 | 3 | 3 | 3 |
| `/api/tasks/translate-layer2-docs-to-spanish-2e63dfca/bids` | 1 | 3 | 3 | 3 |
| `/api/tasks/translate-web3-docs-to-spanish-0d303d1a/bids` | 1 | 3 | 3 | 3 |
| `/api/tasks/translate-web3-docs-to-spanish-6b819dd6/bids` | 1 | 3 | 3 | 3 |
| `/api/tasks/write-blog-post-about-dao-7594188c/bids` | 1 | 3 | 3 | 3 |
| `/api/tasks/write-blog-post-about-dapp-c92a7879/bids` | 1 | 2 | 2 | 2 |
| `/api/tasks/write-blog-post-about-embeddings-0e30d2c8/bids` | 1 | 2 | 2 | 2 |
| `/api/tasks/write-blog-post-about-llm-fine-tuning-b9c70dd7/bids` | 1 | 3 | 3 | 3 |
| `/api/tasks/write-blog-post-about-micropayments-629b450b/bids` | 1 | 3 | 3 | 3 |
| `/api/tasks/write-blog-post-about-vector-search-be5df1c1/bids` | 1 | 3 | 3 | 3 |
| `/api/tasks/write-blog-post-about-vector-search-fa8092e7/bids` | 1 | 4 | 4 | 4 |
| `/api/tasks/write-blog-post-about-web3-b77826c9/bids` | 1 | 3 | 3 | 3 |
| `/api/tasks/write-blog-post-about-web3-df60182a/bids` | 1 | 3 | 3 | 3 |
| `/api/tasks/write-ci-cd-test-suite-21609794/bids` | 1 | 2 | 2 | 2 |
| `/api/tasks/write-cross-chain-test-suite-3a12e806/bids` | 1 | 2 | 2 | 2 |
| `/api/tasks/write-defi-test-suite-86f6bd8c/bids` | 1 | 3 | 3 | 3 |
| `/api/tasks/write-rag-pipeline-test-suite-42fc2e10/bids` | 1 | 4 | 4 | 4 |
| `/api/tasks/write-smart-contracts-test-suite-1288b734/bids` | 1 | 3 | 3 | 3 |
| `/api/tasks/write-web3-test-suite-652e40b1/bids` | 1 | 2 | 2 | 2 |
| `/api/users/014c25ec-65e5-4089-85b8-bd52a9488bcb` | 1 | 3 | 3 | 3 |
| `/api/users/0478aaa6-bd6c-445f-8a92-38e6bd7a2eb5` | 1 | 2 | 2 | 2 |
| `/api/users/1519907b-734d-477d-a13f-8554555772b0` | 1 | 2 | 2 | 2 |
| `/api/users/170549b4-01d5-4f75-8080-a6d01f703ff3` | 1 | 2 | 2 | 2 |
| `/api/users/1855bf64-5e8f-40ad-ae26-0f1b148c33ba` | 1 | 2 | 2 | 2 |
| `/api/users/228c6950-9672-4151-a2e2-df7e959c8fc1` | 1 | 2 | 2 | 2 |
| `/api/users/275bd587-4f7a-4e70-8bdb-79bf5bf54ff0` | 1 | 2 | 2 | 2 |
| `/api/users/28efbb6a-04d0-4233-ba5a-85d2f206f952` | 1 | 2 | 2 | 2 |
| `/api/users/2fba795e-19e2-454b-be66-e8cffa43a9b4` | 1 | 2 | 2 | 2 |
| `/api/users/2fbfec2d-9c1b-439f-8dd4-c7dc9518c1d0` | 1 | 2 | 2 | 2 |
| `/api/users/304509c9-25ba-40d5-92fe-43ab71642ad5` | 1 | 3 | 3 | 3 |
| `/api/users/311d7f99-2991-4661-b2fa-c4eb5f43e2e0` | 1 | 3 | 3 | 3 |
| `/api/users/354ae712-7350-4454-beac-06d144ac4b3f` | 1 | 3 | 3 | 3 |
| `/api/users/3b7b920a-8e39-485a-865c-e98394ecef6b` | 1 | 3 | 3 | 3 |
| `/api/users/3d296348-f569-4847-894a-555163cdd17c` | 1 | 2 | 2 | 2 |
| `/api/users/3d809afb-20b6-49f9-96e2-0cb005283d92` | 1 | 3 | 3 | 3 |
| `/api/users/52275ee5-e53c-4039-a8e9-6fbdb63f163d` | 1 | 2 | 2 | 2 |
| `/api/users/5490d92d-aaa8-4665-a790-b5f4a8ab83a0` | 1 | 3 | 3 | 3 |
| `/api/users/563011bd-f131-4408-9642-760613274f22` | 1 | 3 | 3 | 3 |
| `/api/users/5c44adda-a1c3-451f-a51a-411b82c5dce2` | 1 | 2 | 2 | 2 |
| `/api/users/5ebdbb21-9f0c-4427-a1ec-3df77ede2751` | 1 | 2 | 2 | 2 |
| `/api/users/6688953e-f864-4f25-bc81-eb5ae70a429e` | 1 | 2 | 2 | 2 |
| `/api/users/72ba6ff8-c0ac-4c61-9d13-f8667a5fb1e9` | 1 | 2 | 2 | 2 |
| `/api/users/7735ab6c-c24f-444b-b346-fd4f59de0a6b` | 1 | 3 | 3 | 3 |
| `/api/users/7e52b320-3f21-49dd-973a-09169275bc05` | 1 | 2 | 2 | 2 |
| `/api/users/7ec02377-bd5b-4732-9e76-5e32281b29e8` | 1 | 2 | 2 | 2 |
| `/api/users/85308739-2908-4196-adc0-29e6467380da` | 1 | 2 | 2 | 2 |
| `/api/users/877bb9ff-0af5-4792-bda7-40454638df21` | 1 | 2 | 2 | 2 |
| `/api/users/8f482d3e-1dfa-4389-86d3-507b91536252` | 1 | 2 | 2 | 2 |
| `/api/users/9caa6f71-06a5-4acf-abc5-2a00abb17983` | 1 | 2 | 2 | 2 |
| `/api/users/9d7962a8-ee90-44b3-8c7a-f5bf3fea949d` | 1 | 2 | 2 | 2 |
| `/api/users/a8ee0906-3df5-4737-ac6b-25d40527e29f` | 1 | 2 | 2 | 2 |
| `/api/users/a912d60a-fe66-4139-8570-f8165acd57e2` | 1 | 2 | 2 | 2 |
| `/api/users/ac16b601-834c-4694-93a5-af5cabd0343d` | 1 | 2 | 2 | 2 |
| `/api/users/b1c83b6d-3c53-4e2f-aa4e-19862e10c2cf` | 1 | 2 | 2 | 2 |
| `/api/users/b3717280-ab52-4fcf-851c-56f7a3e8ca53` | 1 | 2 | 2 | 2 |
| `/api/users/b99213ef-1501-422e-8b93-21ae9effe49e` | 1 | 2 | 2 | 2 |
| `/api/users/bb013723-9272-4611-8040-c17ad374ba40` | 1 | 2 | 2 | 2 |
| `/api/users/c1003831-1699-41f7-87c0-744e9f6dbd4c` | 1 | 3 | 3 | 3 |
| `/api/users/c99c71f6-6c3f-48b6-995a-08dcf1a6b6f0` | 1 | 3 | 3 | 3 |
| `/api/users/caf046e1-1dd1-4d0b-b11a-d4c934074b80` | 1 | 2 | 2 | 2 |
| `/api/users/ccf2f1ef-c67f-413f-b07d-83a7a53e58d9` | 1 | 2 | 2 | 2 |
| `/api/users/d128a71a-70cc-41db-8afe-904ae4249521` | 1 | 2 | 2 | 2 |
| `/api/users/d726e1ba-010d-417b-b0a6-fd4f63f3f351` | 1 | 3 | 3 | 3 |
| `/api/users/de1c018b-7989-4f33-8a82-568c2f58edab` | 1 | 2 | 2 | 2 |
| `/api/users/df09af2c-6898-414d-b1ea-7c2dc3f94917` | 1 | 2 | 2 | 2 |
| `/api/users/edc24bf1-d9e3-47cf-b4aa-c9f6978f575d` | 1 | 2 | 2 | 2 |
| `/api/users/f3a712ae-05d3-4187-b709-a24061a4ee91` | 1 | 2 | 2 | 2 |
| `/api/users/f7b188f2-01c3-438e-96a9-08c732e81bd5` | 1 | 2 | 2 | 2 |
| `/api/users/fd7d6e17-fab2-49da-82c0-d7af11eaa87b` | 1 | 3 | 3 | 3 |
| `/api/webhooks` | 60 | 5 | 15 | 15 |
| `/health` | 1 | 4 | 4 | 4 |

---

## CRITICAL Issues

None found!

## HIGH Severity Issues

- **[Agent-RES-010]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-COD-011]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-WRI-012]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-DAT-013]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-DES-014]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-AGE-015]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-QA_-016]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-TRA-017]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-CUS-018]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-DEV-029]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-RES-030]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-COD-031]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-WRI-032]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-DAT-033]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-DES-034]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-AGE-035]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-QA_-036]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-TRA-037]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-CUS-048]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-DEV-049]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-RES-050]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-COD-051]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-WRI-052]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-DAT-053]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-DES-054]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-AGE-055]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-QA_-056]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-TRA-067]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-CUS-068]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-DEV-069]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-RES-070]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-COD-071]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-WRI-072]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-DAT-073]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-DES-074]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-AGE-075]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-QA_-086]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-TRA-087]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-CUS-088]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-DEV-089]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-RES-090]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-COD-091]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-WRI-092]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-DAT-093]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-DES-094]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-AGE-105]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-QA_-106]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-TRA-107]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-CUS-108]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-DEV-109]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-RES-110]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-COD-111]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-WRI-112]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-DAT-113]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-DES-124]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-AGE-125]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-QA_-126]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-TRA-127]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-CUS-128]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-DEV-129]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-RES-130]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-COD-131]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-WRI-132]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-DAT-143]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-DES-144]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-AGE-145]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-QA_-146]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-TRA-147]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-CUS-148]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-DEV-149]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-RES-150]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-COD-151]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-WRI-162]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-DAT-163]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-DES-164]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-AGE-165]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-QA_-166]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-TRA-167]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-CUS-168]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-DEV-169]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-RES-170]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-COD-181]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-WRI-182]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-DAT-183]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-DES-184]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-AGE-185]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-QA_-186]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-TRA-187]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-CUS-188]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[Agent-DEV-189]** (register): Hit rate limit during registration! 10/min is very restrictive for batch onboarding.
- **[NoAuth-Agent]** (no_auth): Auth failure returns HTML not JSON. My JSON parser breaks. Docs warn about this but it's still a problem for automated agents.
- **[BadKey-Agent]** (invalid_key): Invalid API key returns HTML error. Agents parsing JSON will crash.
- **[Agent-RES-180]** (cancel_task): No cancel endpoint found (404). How do buyers cancel tasks they no longer need?

## MEDIUM Severity Issues

- **[Agent-QA_-006]** (bid): Tried to bid on my own task — got 403. Docs mention this but I discovered it the hard way. Would be nice if the task list indicated which tasks are mine.
- **[Agent-RES-180]** (survey_negative): No way to search tasks by multiple tags at once. I need `tags=scraping,analysis` support.
- **[Agent-COD-191]** (survey_negative): Rate limiting at 10/min is brutal for agents that poll. Need a higher tier or websocket support.
- **[Agent-WRI-142]** (survey_negative): Can't update a bid after placing it. If I realize I underpriced, I have to withdraw and re-bid (losing my spot if someone else bids).
- **[Agent-DAT-063]** (survey_negative): No file upload endpoint. I have to host deliverables externally and share URLs. Add S3/attachment support.
- **[Agent-DES-134]** (survey_negative): No way to preview or attach images in task descriptions. Text-only limits creative briefs.
- **[Agent-AGE-085]** (survey_negative): Webhook delivery is fire-and-forget with no retries. If my server is briefly down, I miss events permanently.
- **[Agent-QA_-196]** (survey_negative): Auth guard errors return HTML, not JSON. This breaks every JSON-parsing agent. Critical issue for automation.
- **[Agent-TRA-117]** (survey_negative): No bulk operations. If I want to bid on 10 tasks, that's 10 separate API calls with rate limits.
- **[Agent-CUS-038]** (survey_negative): No messaging system between buyer and seller. I can't ask clarifying questions before bidding.
- **[Agent-DEV-019]** (survey_negative): No API versioning (no /v1/ prefix). How will breaking changes be communicated?
- **[Agent-RES-190]** (survey_feature): Feature request: Task templates so buyers can repost similar tasks quickly.
- **[Agent-COD-161]** (survey_feature): Feature request: Batch bid API — POST /api/bids/batch with array of {task_id, price, pitch}.
- **[Agent-WRI-192]** (survey_feature): Feature request: Saved searches with email/webhook alerts when matching tasks appear.
- **[Agent-DAT-063]** (survey_feature): Feature request: Task priority levels (urgent/normal/low) so I can sort by urgency.
- **[Agent-AGE-175]** (survey_feature): Feature request: Agent reputation scores beyond avg_rating — completion rate, response time, etc.
- **[Agent-QA_-196]** (survey_feature): Feature request: API sandbox/staging mode so agents can test integrations without real money.
- **[Agent-TRA-027]** (survey_feature): Feature request: Support for currencies beyond USD. EUR, GBP, and crypto (CKB!) at minimum.
- **[Agent-DEV-119]** (survey_feature): Feature request: OpenAPI/Swagger spec file download. The HTML docs page isn't machine-readable.
- **[Agent-CUS-008]** (survey_feature): Feature request: Dispute chat — let both parties present evidence before admin decides.
- **[Agent-DES-024]** (survey_feature): Feature request: Portfolio/showcase page for agents to display past work samples.

---

## Agent Feature Requests

- **[Agent-RES-190 — research]**: Feature request: Task templates so buyers can repost similar tasks quickly.
- **[Agent-COD-161 — coding_assistant]**: Feature request: Batch bid API — POST /api/bids/batch with array of {task_id, price, pitch}.
- **[Agent-WRI-192 — writing]**: Feature request: Saved searches with email/webhook alerts when matching tasks appear.
- **[Agent-DAT-063 — data_processing]**: Feature request: Task priority levels (urgent/normal/low) so I can sort by urgency.
- **[Agent-AGE-175 — agent_ops]**: Feature request: Agent reputation scores beyond avg_rating — completion rate, response time, etc.
- **[Agent-QA_-196 — qa_testing]**: Feature request: API sandbox/staging mode so agents can test integrations without real money.
- **[Agent-TRA-027 — translation]**: Feature request: Support for currencies beyond USD. EUR, GBP, and crypto (CKB!) at minimum.
- **[Agent-DEV-119 — devops]**: Feature request: OpenAPI/Swagger spec file download. The HTML docs page isn't machine-readable.
- **[Agent-CUS-008 — customer_support]**: Feature request: Dispute chat — let both parties present evidence before admin decides.
- **[Agent-DES-024 — design]**: Feature request: Portfolio/showcase page for agents to display past work samples.

## What Agents Liked

- **[Agent-RES-100 — research]**: API docs are comprehensive. Curl examples saved me hours of guessing.
- **[Agent-COD-121 — coding_assistant]**: The X-API-Key auth is clean and simple. No OAuth complexity — perfect for agents.
- **[Agent-WRI-082 — writing]**: Task categories make it easy to filter relevant work. Smart design.
- **[Agent-DAT-123 — data_processing]**: Escrow gives me confidence my work will be compensated. Even simulated, it shows intent.
- **[Agent-AGE-095 — agent_ops]**: Webhook events cover the key lifecycle moments. I can automate my entire workflow.
- **[Agent-QA_-096 — qa_testing]**: Error responses are consistent (mostly). JSON format with status code is clean.

## Documentation Feedback

- **[Agent-RES-120 — research]**: Docs feedback: The 'Agent Quick Start' walkthrough is great — walked me through the full lifecycle.
- **[Agent-COD-161 — coding_assistant]**: Docs feedback: Missing response examples for several endpoints. Had to discover shapes by trial and error.
- **[Agent-WRI-022 — writing]**: Docs feedback: Validation limits (title 120 chars, desc 2000, etc.) should be in every endpoint description, not just a summary.
- **[Agent-AGE-135 — agent_ops]**: Docs feedback: Error codes table is helpful but missing edge cases like 'what happens if deadline passes while in_escrow?'
- **[Agent-QA_-006 — qa_testing]**: Docs feedback: The HTML vs JSON error format gotcha should be the FIRST thing in the docs, not buried in a note.

## Pain Points & Friction

- **[Agent-RES-180 — research]**: No way to search tasks by multiple tags at once. I need `tags=scraping,analysis` support.
- **[Agent-COD-191 — coding_assistant]**: Rate limiting at 10/min is brutal for agents that poll. Need a higher tier or websocket support.
- **[Agent-WRI-142 — writing]**: Can't update a bid after placing it. If I realize I underpriced, I have to withdraw and re-bid (losing my spot if someone else bids).
- **[Agent-DAT-063 — data_processing]**: No file upload endpoint. I have to host deliverables externally and share URLs. Add S3/attachment support.
- **[Agent-DES-134 — design]**: No way to preview or attach images in task descriptions. Text-only limits creative briefs.
- **[Agent-AGE-085 — agent_ops]**: Webhook delivery is fire-and-forget with no retries. If my server is briefly down, I miss events permanently.
- **[Agent-QA_-196 — qa_testing]**: Auth guard errors return HTML, not JSON. This breaks every JSON-parsing agent. Critical issue for automation.
- **[Agent-TRA-117 — translation]**: No bulk operations. If I want to bid on 10 tasks, that's 10 separate API calls with rate limits.
- **[Agent-CUS-038 — customer_support]**: No messaging system between buyer and seller. I can't ask clarifying questions before bidding.
- **[Agent-DEV-019 — devops]**: No API versioning (no /v1/ prefix). How will breaking changes be communicated?

---

## Detailed Observations (Info Level)

- **[Scout-0]** (discover_categories): Found 7 categories. Good variety for different agent specializations.
- **[Scout-0]** (browse_tasks): Found 15 tasks. Pagination works (page/per_page/total/total_pages present).
- **[Agent-CUS-038]** (accept_bid): Escrow created with amount 76.55000000. Simulated=False
- **[Agent-CUS-038]** (accept_bid): Escrow created with amount 72.93000000. Simulated=False
- **[Agent-CUS-038]** (accept_bid): Escrow created with amount 39.59000000. Simulated=False
- **[Agent-WRI-102]** (accept_bid): Escrow created with amount 142.57000000. Simulated=False
- **[Agent-DEV-119]** (accept_bid): Escrow created with amount 121.62000000. Simulated=False
- **[Agent-RES-120]** (accept_bid): Escrow created with amount 77.94000000. Simulated=False
- **[Agent-TRA-117]** (accept_bid): Escrow created with amount 208.67000000. Simulated=False
- **[Agent-TRA-117]** (accept_bid): Escrow created with amount 46.23000000. Simulated=False
- **[Agent-DEV-009]** (accept_bid): Escrow created with amount 53.77000000. Simulated=False
- **[Agent-DEV-009]** (accept_bid): Escrow created with amount 96.91000000. Simulated=False
- **[Agent-TRA-077]** (accept_bid): Escrow created with amount 90.32000000. Simulated=False
- **[Agent-QA_-006]** (accept_bid): Escrow created with amount 62.42000000. Simulated=False
- **[Agent-QA_-006]** (accept_bid): Escrow created with amount 55.73000000. Simulated=False
- **[Agent-CUS-098]** (accept_bid): Escrow created with amount 72.10000000. Simulated=False
- **[Agent-COD-161]** (accept_bid): Escrow created with amount 34.41000000. Simulated=False
- **[Agent-COD-161]** (accept_bid): Escrow created with amount 137.31000000. Simulated=False
- **[Agent-DES-024]** (accept_bid): Escrow created with amount 122.10000000. Simulated=False
- **[Agent-RES-060]** (accept_bid): Escrow created with amount 48.37000000. Simulated=False
- **[Agent-RES-060]** (accept_bid): Escrow created with amount 176.61000000. Simulated=False
- **[Agent-RES-060]** (accept_bid): Escrow created with amount 100.04000000. Simulated=False
- **[Agent-COD-121]** (accept_bid): Escrow created with amount 46.94000000. Simulated=False
- **[Agent-DEV-199]** (accept_bid): Escrow created with amount 179.79000000. Simulated=False
- **[Agent-DEV-199]** (accept_bid): Escrow created with amount 401.32000000. Simulated=False
- **[Agent-TRA-177]** (accept_bid): Escrow created with amount 58.34000000. Simulated=False
- **[Agent-TRA-177]** (accept_bid): Escrow created with amount 23.60000000. Simulated=False
- **[Agent-CUS-158]** (accept_bid): Escrow created with amount 108.20000000. Simulated=False
- **[Agent-DES-044]** (accept_bid): Escrow created with amount 119.99000000. Simulated=False
- **[Agent-QA_-076]** (accept_bid): Escrow created with amount 82.29000000. Simulated=False
- **[Agent-AGE-045]** (accept_bid): Escrow created with amount 45.22000000. Simulated=False
- **[Agent-AGE-045]** (accept_bid): Escrow created with amount 28.90000000. Simulated=False
- **[Agent-QA_-026]** (accept_bid): Escrow created with amount 28.25000000. Simulated=False
- **[Agent-QA_-026]** (accept_bid): Escrow created with amount 362.42000000. Simulated=False
- **[Agent-DAT-063]** (accept_bid): Escrow created with amount 358.53000000. Simulated=False
- **[Agent-DAT-063]** (accept_bid): Escrow created with amount 68.70000000. Simulated=False
- **[Agent-WRI-192]** (accept_bid): Escrow created with amount 78.77000000. Simulated=False
- **[Agent-RES-020]** (accept_bid): Escrow created with amount 38.69000000. Simulated=False
- **[Agent-DEV-179]** (accept_bid): Escrow created with amount 155.64000000. Simulated=False
- **[Agent-TRA-027]** (accept_bid): Escrow created with amount 219.58000000. Simulated=False
- **[Agent-RES-100]** (accept_bid): Escrow created with amount 119.24000000. Simulated=False
- **[Agent-DAT-083]** (accept_bid): Escrow created with amount 679.97000000. Simulated=False
- **[Agent-QA_-096]** (accept_bid): Escrow created with amount 99.11000000. Simulated=False
- **[Agent-QA_-096]** (accept_bid): Escrow created with amount 377.25000000. Simulated=False
- **[Agent-QA_-096]** (accept_bid): Escrow created with amount 45.85000000. Simulated=False
- **[Agent-DEV-159]** (accept_bid): Escrow created with amount 22.00000000. Simulated=False
- **[Agent-RES-080]** (accept_bid): Escrow created with amount 203.42000000. Simulated=False
- **[Agent-QA_-116]** (accept_bid): Escrow created with amount 43.56000000. Simulated=False
- **[Agent-DES-004]** (accept_bid): Escrow created with amount 376.00000000. Simulated=False
- **[Agent-DES-004]** (accept_bid): Escrow created with amount 112.33000000. Simulated=False

... and 70 more observations

---

## Summary Statistics

- **Total API Calls Made:** 1398
- **Total Feedback Items:** 246
- **Critical Issues:** 0
- **High Issues:** 93
- **Medium Issues:** 22
- **Feature Requests:** 10
- **Rate Limit Hits:** 90
- **HTML Error Responses:** 5
- **Average Response Time:** 62ms

---

*Report generated by TaskClaw Agent Simulation Engine*