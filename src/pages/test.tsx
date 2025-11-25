import { type NextPage } from "next";
import { useState } from "react";
import { UploadButton } from "../utils/uploadthing";


const Test: NextPage = () => {
  const [fileData, setFileData] = useState<{ url: string; key: string } | null>(
    null
  );

  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-bold">Test page</h1>
      <main className="flex flex-col items-center gap-4">
        <UploadButton
          endpoint="audioUploader"
          onClientUploadComplete={(res) => {
            // Do something with the response
            console.log("Files: ", res);
            if (res && res[0]) {
              setFileData({
                url: res[0].url,
                key: res[0].key,
              });
            }
          }}
          onUploadError={(error: Error) => {
            // Do something with the error.
            alert(`ERROR! ${error.message}`);
          }}
        />

        {fileData && (
          <div className="mt-4 flex flex-col gap-2 rounded border p-4">
            <h2 className="text-xl font-semibold">Upload Result:</h2>
            <div className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-2">
              <span className="font-bold">URL:</span>
              <a
                href={fileData.url}
                target="_blank"
                rel="noreferrer"
                className="break-all text-blue-500 hover:underline"
              >
                {fileData.url}
              </a>

              <span className="font-bold">Key:</span>
              <span className="break-all font-mono text-sm">
                {fileData.key}
              </span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Test;