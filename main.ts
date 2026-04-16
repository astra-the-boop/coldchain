import fs = require("fs");
import path = require("path");
import cheerio = require("cheerio");
import axios from "axios";

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

function findImg(html){
    const $ = cheerio.load(html);
    const imgs = [];

    $("img").each((_, el) => {
        const src = $(el).attr("src");
        if(src && src.startsWith("http")){
            imgs.push(src)
        }
    });

    return imgs;
}


async function download(url, output) {
    const response = await axios({
        url, method: "GET", responseType: "stream",
    });

    return new Promise((res, rej) => {
        const writer = fs.createWriteStream(output);
        response.data.pipe(writer);

        writer.on("finish", res);
        writer.on("error", rej);
    })
}
// console.log(getFiles("/Users/astra.celestine/Desktop/site"));