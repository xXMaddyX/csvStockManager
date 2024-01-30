import { parentPort } from 'worker_threads'
import Papa from 'papaparse';
import fs from 'fs';

parentPort.on('message', async (csvUrl) => {
    try {
        const data = fs.createReadStream(`${csvUrl}`);
        Papa.parse(data, {
            complete: (result) => {
                const jsonData = parseToJSON(result.data);
                parentPort.postMessage(jsonData);
                parentPort.close();
            },
            error: (err) => {
                parentPort.postMessage(err);
                parentPort.close();
            }
        });
    } catch (err) {
        parentPort.postMessage(err);
        parentPort.close();
    }
});

const parseToJSON = (result) => {
    let JsonData = [];
    result.forEach((element) => {
        let obj = {
            Hauptartikelnr: element[0],
            Artikelname: element[1],
            Hersteller: element[2],
            Beschreibung: element[3],
            Materialangaben:element[4],
            Geschlecht: element[5],
            Produktart: element[6],
            Ärmel: element[7],
            Bein: element[8],
            Kragen: element[9],
            Hersteller2: element[10],
            Taschenart: element[11],
            Grammatur: element[12],
            Material: element[13],
            Ursprungsland: element[14],
            Bildname: element[15]
        };
        JsonData.push(obj);
    });
    return JsonData;
};