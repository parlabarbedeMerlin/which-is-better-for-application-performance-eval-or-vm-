const { exec } = require('child_process');
// Fonction pour supprimer les codes d'échappement ANSI de la chaîne
function removeANSIEscapeCodes(input) {
    return input.replace(/\u001b\[\d+m/g, '');
}

export default function handler (req, res) {
    const runCalculation = () => {
        return new Promise((resolve, reject) => {
            const calculateProcess = exec('node pages/api/calcul.js', (error, stdout, stderr) => {
                if (error) {
                    console.error(`Error executing the script: ${error}`);
                    reject('An error occurred during calculation.');
                } else {
                    const formattedResult = removeANSIEscapeCodes(stdout).trim();
                    console.log(`stdout: ${formattedResult}`);
                    resolve(formattedResult);
                }
            });

            calculateProcess.on('close', (code) => {
                if (code !== 0) {
                    reject('An error occurred during calculation.');
                }
            });
        });
    };

    runCalculation()
        .then((result) => {
            res.status(200).json({ result });
        })
        .catch((error) => {
            res.status(500).json({ error });
        });
}
