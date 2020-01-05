const terraformer = require('terraformer')
const terraformerparser = require('terraformer-wkt-parser')
const ldfetch = require('ldfetch')

const TYPE = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";
const MUNICIPALITYNAMETYPE = 'https://data.vlaanderen.be/ns/adres#Gemeentenaam';
const MUNICIPALITYTYPE = 'https://data.vlaanderen.be/ns/adres#Gemeentenaam';
const STREETTYPE = 'https://data.vlaanderen.be/ns/adres#Gemeentenaam';
const ADDRESSTYPE = 'https://data.vlaanderen.be/ns/adres#Adres';
const POSITIONPREDICATE = "https://data.vlaanderen.be/ns/adres#positie"
const POSITIONPREDICATEWKTREPRESENTATION = "http://www.opengis.net/ont/geosparql#asWKT"

const GEMEENTENAAMPREDICATE = 'https://data.vlaanderen.be/ns/adres#heeftGemeentenaam'
const STREETNAMEPREDICATE = 'https://data.vlaanderen.be/ns/adres#heeftStraatnaam'
const HOUSENUMBERPREDICATE =  'https://data.vlaanderen.be/ns/adres#huisnummer'


export class MemberExtraction {
  fetcher = new ldfetch({})
  extractAddresses = (quads : any, ids : Array<string>) => {
    let returnMap = new Map()
    let addressEntries = new Array()
    for (let quad of quads){
      if (quad.predicate.value === TYPE && quad.object.value === ADDRESSTYPE) {
        addressEntries.push(quad.subject.value )
      }
      if (ids.indexOf(quad.subject.value) !== -1){
        let quadsList = returnMap.get(quad.subject.value)
        if (quadsList !== undefined) {
          quadsList.push(quad)
        } else {
          returnMap.set( quad.subject.value, [quad] )
        }
      }
    }
    for (let k of Array.from(returnMap.keys())) {
      if (addressEntries.indexOf(k) === -1){
        returnMap.delete(k);
      }
    }
    return returnMap;
  }

  extractIds = (quads : any, ids : Array<string>) => {
    let returnMap = new Map()
    for (let quad of quads){
      if (ids.indexOf(quad.subject.value) !== -1){
        let quadsList = returnMap.get(quad.subject.value)
        if (quadsList !== undefined) {
          quadsList.push(quad)
        } else {
          returnMap.set( quad.subject.value, [quad] )
        }
      }
    }
    return returnMap;
  }

  extractAddressInfoFromData = (data : any, searchWKTString = null) => {
    let collections = data.collections
    let nodes = data.nodes
    let quads = data.quads

    let addresses = []

    for (let collection of collections){
      let positionMapping = new Map()
      let positionIdentifiers = []
      
      let addressMap = this.extractAddresses(quads, collection.members)
      for (let addressEntry of Array.from(addressMap.entries())){
        for (let quad of addressEntry[1]){
          if (quad.predicate.value === POSITIONPREDICATE){
            positionIdentifiers.push(quad.object.value)
            positionMapping.set(quad.subject.value, quad.object.value)
          }
        }
      }

      let positionLocationMapping = new Map()
      let positions = this.extractIds(quads, positionIdentifiers)
      for (let positionEntry of Array.from(positions.entries())){
        for (let quad of positionEntry[1]){
          if (quad.predicate.value === POSITIONPREDICATEWKTREPRESENTATION){
            positionLocationMapping.set(quad.subject.value, quad.object.value)
          }
        }
      }

      let searchLocation = null
      if (searchWKTString !== null){
        searchLocation = new terraformer.Primitive(terraformerparser.parse(searchWKTString)) 
      }

      for (let addressEntry of Array.from(addressMap.entries())){
        let id = addressEntry[0]
        let locationWKT = positionLocationMapping.get(positionMapping.get(addressEntry[0]))
        let location = terraformerparser.parse(locationWKT);

        if (searchLocation === null || isContained(searchLocation, location) ){ //|| isOverlapping(searchLocation, addresslocation)){
          let number = null;
          let streetId = null;
          let gemeenteId = null;

          for (let quad of addressEntry[1]){
            if (quad.predicate.value === HOUSENUMBERPREDICATE){
              number = quad.object.value
            } else if (quad.predicate.value === STREETNAMEPREDICATE){
              streetId = quad.object.value
            } else if (quad.predicate.value === GEMEENTENAAMPREDICATE){
              gemeenteId = quad.object.value
            } 
          }
          addresses.push(
            new Address(id, number, location, streetId, gemeenteId)
          )
        }
      }
    }
    return addresses
  }

  fetchAddressInfo = async (address : any) => {
    let gemeenteQuads = this.fetcher.get(address.gemeenteId)
    let streetQuads = this.fetcher.get(address.streetId)

    return await Promise.all([gemeenteQuads, streetQuads])
  }

  extractMunicipalities = (quads : any, ids : Array<string>) => {
    let returnMap = new Map()
    let municipalityEntries = new Array()
    for (let quad of quads){
      if ( (quad.predicate.value === TYPE && quad.object.value === MUNICIPALITYTYPE) ||
             (quad.predicate.value === TYPE && quad.object.value === MUNICIPALITYNAMETYPE)) {
        municipalityEntries.push(quad.subject.value)
      }
      if (ids.indexOf(quad.subject.value) !== -1){
        let quadsList = returnMap.get(quad.subject.value)
        if (quadsList !== undefined) {
          quadsList.push(quad)
        } else {
          returnMap.set( quad.subject.value, [quad] )
        }
      }
    }
    for (let k of Array.from(returnMap.keys())) {
      if (municipalityEntries.indexOf(k) === -1){
        returnMap.delete(k);
      }
    }
    return returnMap;
  }

  extractMunicipalityInfoFromData = (data : any) => {
    let collections = data.collections
    let nodes = data.nodes
    let quads = data.quads

    let municipalities = []

    for (let collection of collections){
      let municipalitiesNameMapping = new Map()
      let municipalityIdentifiers = []
      
      for (let addressNameEntry of Array.from(this.extractMunicipalities(quads, collection.members).entries())){
        let label = null;
        let isDerivedOf = null;
        
        for (let quad of addressNameEntry[1]){
          if (quad.predicate.value === "http://www.w3.org/2000/01/rdf-schema#label"){
            label = quad.object.value
          } else if (quad.predicate.value === "https://data.vlaanderen.be/ns/adres#isAfgeleidVan"){
            isDerivedOf = quad.object.value
          } 
        }
        let municipality = {
          id : addressNameEntry[0],
          label: label,
          isDerivedOf : isDerivedOf,
        }

        municipalitiesNameMapping.set(municipality.isDerivedOf, municipality)
        municipalityIdentifiers.push(municipality.isDerivedOf)
      }

      for (let addressEntry of Array.from(this.extractIds(quads, municipalityIdentifiers).entries())){
        let municipality : any = {id : addressEntry[0]}
        let municipalityName = municipalitiesNameMapping.get(addressEntry[0]) 
        for (let quad of addressEntry[1]){
          if (quad.predicate.value === 'http://www.w3.org/2000/01/rdf-schema#seeAlso'){
            municipality["seeAlso"] = quad.object.value
          } else if (quad.predicate.value === 'rdfs:seeAlso'){
            municipality["seeAlso"] = quad.object.value
          }
        }
        municipalityName["isDerivedOf"] = municipality
        municipalities.push(municipalityName)
      }
    }
    return municipalities
  }



  extractStreetInfoFromData = (data : any) => {
    let collections = data.collections
    let nodes = data.nodes
    let quads = data.quads

    let relations : Array<any> = [];
    for (let node of nodes){
      relations = relations.concat(node.relations)
    }
    
    let streets = new Array<Street>();

    for (let collection of collections){
      
      for (let streetNameEntry of Array.from(this.extractIds(quads, collection.members).entries())){
        let label = null
        let wasAttributedTo = null;
        for (let quad of streetNameEntry[1]){
          if (quad.predicate.value === "http://www.w3.org/2000/01/rdf-schema#label"){
            label = quad.object.value
          } else if (quad.predicate.value === "http://www.w3.org/ns/prov#wasAttributedTo"){
            wasAttributedTo = quad.object.value
          }
        }
        let street = new Street(streetNameEntry[0], label, wasAttributedTo)

        for (let relation of relations){
          if (relation.type === "https://w3id.org/tree#EqualThanRelation" && relation.value === street.id){
            street.addressCollection = relation.node;
          }
        }
        streets.push(street)
      }
    }
    return streets
  }
}




function isContained(containerObject : any, containedObject : any) {
  // if (containedObject instanceof terraformer.Point || containedObject instanceof terraformer.Point)  { console.error("wrong object types for isContained"); return false } // Point cannot contain other polygon or point
  let containerWKTPrimitive = new terraformer.Primitive(containerObject)
  try {
    return (containerWKTPrimitive.contains(containedObject))
  } catch(err){
      return false;
  }
}

function isOverlapping(containerObject : any, containedObject : any) {
  // if (containerObject instanceof terraformer.Point || containedObject instanceof terraformer.Point)  { console.error("wrong object types for isOverlapping"); return false } // Point cannot contain other polygon or point
  let containerWKTPrimitive = new terraformer.Primitive(containerObject)
  try {
    return (containerWKTPrimitive.intersects(containedObject))
  } catch(err){
      return false;
  }
}

class Address{
  id : string;
  number : number;
  location : any;
  streetId : string;
  gemeenteId : string;
  constructor( id : string, number : number, location : any, streetId : string, gemeenteId : string){
    this.id = id;
    this.number = number;
    this.location = location;
    this.streetId = streetId;
    this.gemeenteId = gemeenteId;
  }
}

class Street{
  id : string;
  label : string;
  wasAttributedTo : string;
  addressCollection : any;
  constructor( id : string, label : string, wasAttributedTo : string){
    this.id = id;
    this.label = label;
    this.wasAttributedTo = wasAttributedTo;
  }
}

