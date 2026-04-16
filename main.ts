import fs = require("fs");
import path = require("path");

function getFiles(dir): string[]{
    let results:string[] = [];
    const list = fs.readdirSync(dir);

    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if(stat && stat.isDirectory()){
            results = results.concat(getFiles(fullPath));
        }else{
            results.push(fullPath);
        }
    });

    return results
}



// console.log(getFiles("/Users/astra.celestine/Desktop/site"));