import { BlobServiceClient } from "@azure/storage-blob";
import Papa from "papaparse";

const AZURE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const CONTAINER_NAME = process.env.AZURE_STORAGE_CONTAINER_NAME;
const BLOB_NAME = "All_Diets.csv"; // your CSV file name

export default async function loadCSV() {
  if (!AZURE_CONNECTION_STRING || !CONTAINER_NAME) {
    throw new Error("Azure Storage environment variables not set");
  }

  const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_CONNECTION_STRING);
  const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
  const blobClient = containerClient.getBlobClient(BLOB_NAME);

  const downloadBlockBlobResponse = await blobClient.download();
  const csvString = await streamToString(downloadBlockBlobResponse.readableStreamBody);

  const parsed = Papa.parse(csvString, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true
  });

  return parsed.data;
}

// helper to read Azure blob stream to string
async function streamToString(readableStream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readableStream.on("data", chunk => chunks.push(chunk.toString()));
    readableStream.on("end", () => resolve(chunks.join("")));
    readableStream.on("error", reject);
  });
}