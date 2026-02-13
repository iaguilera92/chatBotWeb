import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import * as XLSX from "xlsx";
import { Readable } from "stream";

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

const KEY = "TrabajosEnRevision.xlsx";

async function streamToBuffer(stream: Readable): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const chunks: any[] = [];
        stream.on("data", chunk => chunks.push(chunk));
        stream.on("error", reject);
        stream.on("end", () => resolve(Buffer.concat(chunks)));
    });
}

export async function s3TrabajoEnRevision(data: { email: string; business: string; phone: string; offer?: string; }): Promise<number> {
    try {
        console.log("📥 Iniciando insert en S3...", data);

        const getCommand = new GetObjectCommand({ Bucket: process.env.BUCKET_NAME, Key: KEY });
        const response = await s3.send(getCommand);
        const buffer = await streamToBuffer(response.Body as Readable);

        const workbook = XLSX.read(buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        const jsonData: any[] = XLSX.utils.sheet_to_json(sheet);

        const lastId = jsonData.length > 0
            ? Math.max(...jsonData.map(r => Number(r.Id)))
            : 0;
        const newId = lastId + 1;

        const newRow = { Id: newId, Negocio: data.business, EmailCliente: data.email, TelefonoCliente: data.phone, Porcentaje: 1, Estado: 1, Revision: 1, FechaCreacion: new Date().toISOString() };
        jsonData.push(newRow);

        const newSheet = XLSX.utils.json_to_sheet(jsonData);
        workbook.Sheets[sheetName] = newSheet;

        const newBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
        const putCommand = new PutObjectCommand({ Bucket: process.env.BUCKET_NAME, Key: KEY, Body: newBuffer, ContentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        await s3.send(putCommand);

        console.log("📊 Nuevo trabajo agregado al Excel en S3, Id:", newId);
        return newId; // ✅ ahora devolvemos el Id
    } catch (error) {
        console.error("❌ Error en S3:", error);
        throw error;
    }
}
