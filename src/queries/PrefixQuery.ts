import { Query } from './Query';


// const normalizeString = require('stringnormalizer');

const normalizeString = function(e : string) {return e.toLowerCase()}


export class PrefixQuery extends Query {  

  //todo:: being able to continue querying on nodes that are stored in the session.

  async followChildRelations(nodeId : any, nodesMetadata : any, value : any, followedValue : any, level : any) : Promise<Array<any>> {
    let runningQueries = new Array()
    for (let node of nodesMetadata){
      if (node.id === nodeId){  
        // let normalizedPredixString = normalizeString(value)
        // let followedValueNormalized = normalizeString(followedValue)
        // let followedValueNormalized = followedValue
        // if (followedValueNormalized === normalizedPredixString || followedValueNormalized.startsWith(normalizedPredixString)){ return []}

        // if (node.relations.map( (relation:any) => relation.type).indexOf("https://w3id.org/tree#PrefixRelation") === -1){ return []}

        for (let relation of node.relations){
          if (relation.type === "https://w3id.org/tree#PrefixRelation"){
              runningQueries.push(await this.followChildWithValue(relation.node, relation.value, value, level))
          }
        }
      }
    }
    await Promise.all(runningQueries);
    let returnlist = new Array();
    for (let list of await runningQueries){
      returnlist = returnlist.concat(await list)
    }
    return returnlist
  }

  async followChildWithValue(relationNodeId: any, relationValue: any, searchValue: any, level: any) : Promise<Array<any>> {
    let normalizedPrefixString = normalizeString(searchValue)
    let normalizedRelationValue = normalizeString(relationValue)
    if (normalizedPrefixString.startsWith(normalizedRelationValue) || normalizedRelationValue.startsWith(normalizedPrefixString) ){
      return await this.recursiveQueryNode(relationNodeId, searchValue, relationValue, level)
    } else {
      return []
    }
  }

  getInitialSearchValue() : any{
    return "";
  }
}
