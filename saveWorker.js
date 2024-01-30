import fs from 'fs';
import { parentPort } from 'worker_threads';
import Papa from 'papaparse'; // Import hinzufügen

const dataStore = {
    csvUrl: './dist/csv/Artikel.csv'
}

parentPort.on('message', async(data) => {
    try {
        await parsToCsv(data);
        const writer = fs.createWriteStream(dataStore.csvUrl);
        writer.write(dataStore.csvToSave);
        writer.end();
        parentPort.postMessage('File saved successfully');
        parentPort.close();
    } catch (err) {
        console.log("Fail to Save File", err);
        parentPort.postMessage('Error saving file');
        parentPort.close();
    }
});

const parsToCsv = async (data) => {
    let dataList = [];
    for (let obj of data) {
        let objList = [];
        for (let item in obj) {
            objList.push(obj[item]);
        }
        dataList.push(objList);
    };
    dataStore.csvToSave = Papa.unparse(dataList);
};