import fs from 'fs';
import Papa from 'papaparse';

const dataStore = {
    /**@type {JSON} */
    clientJsonData: undefined,
    /**@type {any[][]} */
    csvToSave: undefined,
}

//Load and Parse CSV from Filesystem
const loadCSV = async (csvUrl) => {
    try {
        const data = fs.createReadStream(`${csvUrl}`);
        const retData = await new Promise((resolve, reject) => {
            /**@type {Papa.LocalFile} */
            Papa.parse(data, {
                complete: (result) => {
                    resolve(parsToJSON(result.data));
                },
                error: (err) => {
                    reject(err);
                }
            });
        });
        return retData;
    } catch (err) {
        console.log(`Fehler beim Laden der CSV Datei`, err);
        throw err;
    }
};

const parsToJSON = (result) => {
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
//------------------------------------------------------------------

//Parse and Save CSV to FileSystem
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

const saveCSV = async(csvUrl, data) => {
    try {
        await parsToCsv(data);
        const writer = fs.createWriteStream(`${csvUrl}`);
        writer.write(dataStore.csvToSave);
    } catch (err) {
        console.log("Fail to Save File", err);
    };
};

export {
    dataStore,
    loadCSV,
    saveCSV
};