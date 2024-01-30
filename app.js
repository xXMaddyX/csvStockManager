import express from 'express';
import cors from 'cors';
import { Worker } from 'worker_threads'

const config = {
    port: 3030,
    hostname: "127.0.0.1",
    csvUrl: './dist/csv/Artikel.csv'
};

const app = express();
app.use(express.static("dist"));
app.use(cors({
    origin: `${config.hostname}:${config.port}`
}));
app.use(express.json({ limit: '5mb' }));

app.get('/data', async (req, res) => {
    try {
        const worker = new Worker('./csvWorker.js');
        worker.postMessage(config.csvUrl);

        worker.on('message', (jsonData) => {
            if (jsonData instanceof Error) {
                console.log("Error at Get Data", jsonData);
                res.status(404).send();
            } else {
                res.send(JSON.stringify(jsonData));
                console.log("Data Load Complete");
            }
        });

    } catch (err) {
        console.log("Error at Get Data", err);
        res.status(404).send();
    }
});

app.get('/dataload', async (req, res) => {
    try {
        res.download(config.csvUrl);
    } catch (err) {
        res.sendStatus(404);
    }
})

app.post('/submitData', async (req, res) => {
    try {
        const worker = new Worker('./saveWorker.js');
        worker.postMessage(req.body);
        worker.on('message', (message) => {
            console.log(message);
            res.send('File saved successfully');
        });

        worker.on('error', (err) => {
            console.log("Fail to Save File from Client", err);
            res.status(500).send('Error saving file');
        });

    } catch (err) {
        console.log("Fail to Save File from Client", err);
        res.status(500).send('Error saving file');
    }
});

app.listen(config.port, config.hostname, () => {
    console.log(`Server is running on http://${config.hostname}:${config.port}`);
});
