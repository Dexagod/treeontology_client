// import { MemberExtraction } from '../helpers/MemberExtraction';
// import { Query } from './Query';
// const parserClass = require('treebrowser').Parser
// const terraformer = require('terraformer')
// const terraformerparser = require('terraformer-wkt-parser')
// const EventEmitter = require('events');

// const TinyQueue = require("tinyqueue")

// let extractAddressInfoFromData = new MemberExtraction().extractAddressInfoFromData

// export class KNNQuery extends Query {  
//   MAXKNNITEMS = 50


//   // Eerst alle contained toevoegen
//   // dan verste afstand berekenen
//   // dan teruggaan en voor alle niet containende nodes kijken wa de afstand is
//   // als afstand < 


//   parser = new parserClass()
//   terminated = false;
//   queue = new TinyQueue([], function (a: any, b: any) {
//     return b.distance - a.distance; // b - a because we want to pop the largest items in the queue
//   });
//   maxdistance = Infinity
//   processedIds : Array<string> = []

//   async query(collectionId: any, value: any, session = null) : Promise<Array<any>>{
//     let long : any = value.long;
//     let lat : any = value.lat;
//     let searchLocation = new terraformer.Primitive({ "type": "Point", "coordinates": [long, lat]})

//     let results = await this.processId(collectionId)

//     for (let collection of results.collections){
//       for (let viewRootNodeId of collection.views){
//         this.handleEmittingMembers(results, viewRootNodeId, null, 0)
//         // recursiveQueryNode(viewRootNodeId, searchLocation)
//         this.followChildRelations(viewRootNodeId, results.nodes, searchLocation, 0)
//       }
//     }    

//     return [];
//   }

//   async recursiveQueryNode(currentNodeId: string, searchLocation: any, followedValue: any, level : number){
//     if (this.terminated){ return }
//     let results = await this.processId(currentNodeId)
//     this.handleEmittingMembers(results, currentNodeId, followedValue, level)

//     let addresses = extractAddressInfoFromData(results)

//     for (let address of addresses){
//       let [long, lat] = address.location.coordinates;
//       let [searchlong, searchlat] = searchLocation.coordinates
//       this.addItem(address, getDistancePointPoint(long, lat, searchlong, searchlat))
//     }

//     await this.followChildRelations(currentNodeId, results.nodes, searchLocation, level + 1)

//   }

//   async followChildRelations(nodeId: string, nodesMetadata: any, searchLocation: any, level: number){
//     for (let node of nodesMetadata){
//       if (node.id === nodeId){
//         for (let relation of node.relations){

//           if (this.terminated) { return }

//           if (relation.type === "https://w3id.org/tree#GeospatiallyContainsRelation"){
//             let childValue = terraformerparser.parse(relation.value);
//             if (this.isContained(childValue, searchLocation)) {
//               await this.recursiveQueryNode(relation.node, searchLocation, relation.value, level)
//             } else {
//               // calculate distances
//             }
//           }
//         }
//       }
//     }
//   }

//   addItem(address: any, distance: any){
//     if (this.queue.length < this.MAXKNNITEMS){
//       address.distance = distance
//       this.queue.push(address) // add new address
//       if (distance > this.maxdistance){
//         this.maxdistance = distance
//       }
//     } else {
//       if (distance < this.maxdistance){
//         this.queue.pop() // remove old furthest away address
//         address.distance = distance
//         this.queue.push(address) // add new address
//         this.maxdistance = this.queue.peek().distance
//       }
//     }
//   }


//   isContained(containerObject: any, containedObject: any) {
//     let containerWKTPrimitive = new terraformer.Primitive(containerObject)
//     try {
//       return (containerWKTPrimitive.contains(containedObject))
//     } catch(err){
//         return false;
//     }
//   }

//   async processId(id: any){
//     if (this.processedIds.indexOf(id) !== -1){
//       return
//     }
//     this.processedIds.push(id)
//     return await this.parser.process(id)
//   }



//   async handleEmittingMembers(results: any, searchedNodeId: string, nodeValue: any, level: number){
//     // for (let collection of results.collections){
//     //   this.emit("collection", collection)
//     // }


//     for (let node of results.nodes){
//       if (node.id === searchedNodeId){
//         node.value = nodeValue
//         node.level = level
//         this.emit("node", node)
//       }
//     }

//     this.emit("data", results)

//   }
// }




// function getDistancePointPoint(x: any, y: any, x2: any, y2: any){
//   return  HYPOT(x-x2, y-y2);
// }

// function distancePointBox(x: any, y: any, x_min: any, y_min: any, x_max: any, y_max: any) {
//   if (x < x_min) {
//       if (y <  y_min) return HYPOT(x_min-x, y_min-y);
//       if (y <= y_max) return x_min - x;
//       return HYPOT(x_min-x, y_max-y);
//   } else if (x <= x_max) {
//       if (y <  y_min) return y_min - y;
//       if (y <= y_max) return 0;
//       return y - y_max;
//   } else {
//       if (y <  y_min) return HYPOT(x_max-x, y_min-y);
//       if (y <= y_max) return x - x_max;
//       return HYPOT(x_max-x, y_max-y);
//   }
// }

// function HYPOT(x: any, y: any) { return Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2))}
