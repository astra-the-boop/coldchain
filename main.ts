import * as fs from "fs";
import * as path from "path";
import * as cheerio from "cheerio";
import axios from "axios";
import { AnyNode } from "domhandler";

function getFiles(dir: string): string[] {
    let results: string[] = [];
    const list = fs.readdirSync(dir);

    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat && stat.isDirectory()) {
            results = results.concat(getFiles(fullPath));
        } else {
            results.push(fullPath);
        }
    });

    return results
}

function findImg(html: string) {
    const $ = cheerio.load(html);
    const imgs: any[] = [];

    $("img").each((_: any, el: any) => {
        const src = $(el).attr("src");
        if (src && src.startsWith("http")) {
            imgs.push(src)
        }
    });

    return imgs;
}


async function download(url: any, output: fs.PathLike) {
    const response = await axios({
        url, method: "GET", responseType: "stream", headers:{
            "User-Agent": "Mozilla/5.0",
        }
    });

    return new Promise((res, rej) => {
        const writer = fs.createWriteStream(output);
        response.data.pipe(writer);

        writer.on("finish", res);
        writer.on("error", rej);
    })
}

function replaceImgs(html: string | Buffer | AnyNode | AnyNode[], repl:Record<string,string>){
    const $ = cheerio.load(html);

    $("img").each((_, el) => {
        const src:string = $(el).attr("src") as string;
        if(repl[src]){
            $(el).attr("src", repl[src]);
        }
    });

    return $.html();
}


async function main(){
    const baseDir = "/Users/astra.celestine/Desktop/site-copy";
    const outputDir = path.join(baseDir, "imgs");
    fs.mkdirSync(outputDir, {recursive: true});
    const files = getFiles("/Users/astra.celestine/Desktop/site-copy");
    let c:number = 0;
    let total:number = 0;
    for(const file of files){
        if(!file.endsWith(".html")) continue;
        const html = fs.readFileSync(file, "utf8");
        const imgs = findImg(html);

        const repl:Record<string,string> = {};
        const seen = new Set<string>;

        for(const url of imgs) {
            if(seen.has(url)) continue;
            seen.add(url);
            try{
                const u = new URL(url);
                const filename = decodeURIComponent(path.basename(u.pathname));
                const outputPath = path.join(outputDir, filename);
                const localPath = `./imgs/${filename}`;

                await download(url, outputPath);
                repl[url] = localPath;
                console.log(`Successfully replaced image ${url}`);
                c+=1;
            } catch(err){
                console.log(`${url} error: ${err}`)
            }
        }

        const newHTML = replaceImgs(html, repl);
        fs.writeFileSync(file, newHTML);
        total += seen.size;
    }
    console.log(`Replacement complete: ${c} images replaced out of ${total} found.`);
    process.exit(0);
}

main().catch(console.error);