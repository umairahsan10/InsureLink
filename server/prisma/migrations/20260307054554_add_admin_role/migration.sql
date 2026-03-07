-- AlterTable
ALTER TABLE "chat_messages" ALTER COLUMN "sender_id" DROP NOT NULL,
ALTER COLUMN "receiver_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "claim_events" ALTER COLUMN "actor_user_id" DROP NOT NULL;
