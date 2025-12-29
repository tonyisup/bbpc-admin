BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[AlternateEmail] (
    [id] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [email] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [AlternateEmail_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [AlternateEmail_email_key] UNIQUE NONCLUSTERED ([email])
);

-- AddForeignKey
ALTER TABLE [dbo].[AlternateEmail] ADD CONSTRAINT [AlternateEmail_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
