import { promisify } from 'node:util';
import { exec } from 'child_process';

const promisifiedExec = promisify(exec);

function removeANSIEscapeCodes(input) {
    return input.replace(/\u001b\[\d+m/g, '');
}

export default async function handler(req, res) {
    try {
        const { stdout } = await promisifiedExec('node pages/api/calcul.js');
        const formattedResult = removeANSIEscapeCodes(stdout).trim();
        //console.log(`stdout: ${formattedResult}`);
        //console.log('Calculation result:', formattedResult);
        res.status(200).json({ result: formattedResult });
    } catch (error) {
        console.error(`Error executing the script: ${error}`);
        res.status(500).json({ error: 'An error occurred during calculation.' });
    }
}
