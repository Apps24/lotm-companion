import titles from "./chapter-titles.json";
import sources from "./chapter-source-documents.json";
import entityIds from "./chapter-entity-ids.json";
import signals from "./chapter-signals.json";
const volumes=[{number:1,name:"Clown",start:1,end:213},{number:2,name:"Faceless",start:214,end:482},{number:3,name:"Traveler",start:483,end:732},{number:4,name:"Undying",start:733,end:946},{number:5,name:"Red Priest",start:947,end:1150},{number:6,name:"Lightseeker",start:1151,end:1266},{number:7,name:"The Hanged Man",start:1267,end:1353},{number:8,name:"Fool",start:1354,end:1430}] as const;
const chapters=titles.map((title,index)=>{const number=index+1;const volume=volumes.find(v=>number>=v.start&&number<=v.end)!;const ids=(signals as Record<string,number[]>)[String(number)]||[];const mentions=ids.map(id=>entityIds[id]);return {number,title,volume:volume.number,volumeName:volume.name,sourceDocument:sources[index],mentions,mentionCount:mentions.length,spoilerChapter:number};});
export default chapters;
