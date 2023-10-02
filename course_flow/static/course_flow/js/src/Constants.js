import * as React from "react";
import {getSortedOutcomesFromOutcomeWorkflowSet, getTableOutcomeNodeByID} from "./FindState.js";

/*
Determines how long an action locks an object
by default, in ms. Once the action ends, the lock
is cleared (so this is a maximum time).
*/
export const lock_times = {
    move:5000,
    update:5000,
    select:60000,
}

export const node_keys=["activity","course","program"];
export const columnwidth = 160
export const nodewidth = 200;
export const node_ports={
    source:{
        e:[1,0.6],
        w:[0,0.6],
        s:[0.5,1]
    },
    target:{
        n:[0.5,0],
        e:[1,0.4],
        w:[0,0.4]
    }
}
export const port_keys=["n","e","s","w"];
export const port_direction=[
    [0,-1],
    [1,0],
    [0,1],
    [-1,0]
]
export const port_padding=10;
export const task_keys = {
    0:"",
    1:"research",
    2:"discuss",
    3:"problem",
    4:"analyze",
    5:"peerreview",
    6:"debate",
    7:"play",
    8:"create",
    9:"practice",
    10:"reading",
    11:"write",
    12:"present",
    13:"experiment",
    14:"quiz",
    15:"curation",
    16:"orchestration",
    17:"instrevaluate",
    18:"other",
    101:"jigsaw",
    102:"peer-instruction",
    103:"case-studies",
    104:"gallery-walk",
    105:"reflective-writing",
    106:"two-stage-exam",
    107:"toolkit",
    108:"one-minute-paper",
    109:"distributed-problem-solving",
    110:"peer-assessment"
}
export const context_keys = {
    0:"",
    1:"solo",
    2:"group",
    3:"class",
    101:"exercise",
    102:"test",
    103:"exam"
}
export const strategy_keys = {
    0:"",
    1:"jigsaw",
    2:"peer-instruction",
    3:"case-studies",
    4:"gallery-walk",
    5:"reflective-writing",
    6:"two-stage-exam",
    7:"toolkit",
    8:"one-minute-paper",
    9:"distributed-problem-solving",
    10:"peer-assessment",
    11:"other",
}
export const default_column_settings = {
    0:{colour:"#6738ff",icon:"other"},
    1:{colour:"#0b118a",icon:"ooci"},
    2:{colour:"#114cd4",icon:"home"},
    3:{colour:"#11b3d4",icon:"instruct"},
    4:{colour:"#04d07d",icon:"students"},
    10:{colour:"#6738ff",icon:"other"},
    11:{colour:"#ad351d",icon:"homework"},
    12:{colour:"#ed4a28",icon:"lesson"},
    13:{colour:"#ed8934",icon:"artifact"},
    14:{colour:"#f7ba2a",icon:"assessment"},
    20:{colour:"#369934",icon:"other"}
}
export const node_type_keys = {
    0:"activity node",
    1:"course node",
    2:"program node",
}
export const object_dictionary = {
    nodelink:"nodelink",
    node:"node",
    week:"week",
    column:"column",
    outcome:"outcome",
    outcome_base:"outcome",
    workflow:"workflow",
    outcomenode:"outcomenode",
}
export const parent_dictionary = {
    nodelink:"node",
    node:"week",
    week:"workflow",
    column:"workflow",
    outcome:"outcome",
    outcome_base:"workflow"
}
export const through_parent_dictionary = {
    node:"nodeweek",
    week:"weekworkflow",
    column:"columnworkflow",
    outcome:"outcomeoutcome",
    outcome_base:"outcomeworkflow"
}
export const get_verbose = function(data,object_type){
    switch(object_type){
        case "node":
            return data.node_type_display;
        case "workflow":
        case "activity":
        case "course":
        case "program":
            return {
                "activity":gettext("Activity"),
                "course":gettext("Course"),
                "program":gettext("Program"),
                "workflow":gettext("Workflow"),
            }[data.type]
        case "week":
            return data.week_type_display;
    }
    return {
        "outcome":gettext("Outcome"),
        "outcome_base":gettext("Outcome"),
        "nodelink":gettext("Node Link"),
        "outcome":gettext("Outcome"),
        "column":gettext("Column"),
        "project":gettext("Project"),
        "outcomehorizontallink":gettext("Association to the parent outcome"),
        "outcomenode":gettext("Association to the outcome"),
    }[object_type]
}
export const permission_keys = {
    "none":0,
    "view":1,
    "edit":2,
    "comment":3,
    "student":4,
}
export const role_keys = {
    "none":0,
    "student":1,
    "teacher":2,
}
export const default_drop_state = {
    node:false,
    week:true,
    outcome:[true,false,false,false,false],
}
export const get_default_drop_state = (objectID,objectType,depth=1)=>{
    let default_drop = default_drop_state[objectType];
    if(objectType=="outcome"){
        if(depth<default_drop.length)default_drop=default_drop[depth];
        else default_drop=false;
    }
    return default_drop;
}
//get all the possible custom names. This is super clunky, should probably be switched to ngettext
//export function custom_text_base(){
//    return {
//        "program outcome":{
//            "singular_key":"program outcome",
//            "singular":gettext("program outcome"),
//            "plural_key":"program outcomes",
//            "plural":gettext("program outcomes"),
//        },
//        "course outcome":{
//            "singular_key":"course outcome",
//            "singular":gettext("course outcome"),
//            "plural_key":"course outcomes",
//            "plural":gettext("course outcomes"),
//        },
//        "activity outcome":{
//            "singular_key":"activity outcome",
//            "singular":gettext("activity outcome"),
//            "plural_key":"activity outcomes",
//            "plural":gettext("activity outcomes"),
//        },
//    }
//}
//get all possible object sets
export function object_sets_types(){
    return {
        "program outcome":capFirst(gettext("program outcome")),
        "course outcome":capFirst(gettext("course outcome")),
        "activity outcome":capFirst(gettext("activity outcome")),
        "program node":capFirst(gettext("program node")),
        "course node":capFirst(gettext("course node")),
        "activity node":capFirst(gettext("activity node")),
    }
}
export const parent_workflow_type = {
    program:"",
    course:"program",
    activity:"course"
}
//missing_translations, DO NOT DELETE. This will ensure that a few "utility" translations that don't otherwise show up get translated
function missing_translations(){
    gettext("activity");
    gettext("course");
    gettext("program");
    gettext("project");
}


//Get translate from an svg transform
export function getSVGTranslation(transform){
    var translate = transform.substring(transform.indexOf("translate(")+10, transform.indexOf(")")).split(",");
    return translate;
}

//Get the offset from the canvas of a specific jquery object
export function getCanvasOffset(node_dom){
    var node_offset = node_dom.offset();
    var canvas_offset = $(".workflow-canvas").offset();
    node_offset.left-=canvas_offset.left;
    node_offset.top-=canvas_offset.top;
    return node_offset;
}


//Check if the mouse event is within a box with the given padding around the element
export function mouseOutsidePadding(evt,elem,padding){
    if(elem.length==0) return true;
    let offset = elem.offset();
    let width = elem.outerWidth();
    let height = elem.outerHeight();
    return (evt.pageX<offset.left-padding || evt.pageY<offset.top-padding || evt.pageX>offset.left+width+padding || evt.pageY>offset.top+height+padding);
}


//A utility function to trigger an event on each element. This is used to avoid .trigger, which bubbles (we will be careful to only trigger events on the elements that need them)
export function triggerHandlerEach(trigger,eventname){
    return trigger.each((i,element)=>{$(element).triggerHandler(eventname);});
}


export function pushOrCreate(obj,index,value){
    if(obj[index])obj[index].push(value);
    else obj[index]=[value];
}

export function cantorPairing(k1,k2){
    return parseInt((k1+k2)*(k1+k2+1)/2+k2);
}

export function hasIntersection(list1,list2){
    return list1.filter(value=>list2.includes(value)).length>0;
}

//Gets intersection between two lists. Note that items appear in the same order as in list 1.
export function getIntersection(list1,list2){
    return list1.filter(value=>list2.includes(value));
}

//take a list of objects, then filter it based on which appear in the id list. The list is then resorted to match the order in the id list.
export function filterThenSortByID(object_list,id_list){
    return object_list.filter(obj=>id_list.includes(obj.id)).sort((a,b)=> id_list.indexOf(a.id)-id_list.indexOf(b.id));
}

//capitalize first letter of each word in a string
export function capWords(str){
    return str.split(" ").map(entry=>{
        if(entry.length==0)return entry;
        return entry[0].toUpperCase()+entry.substr(1)
    }).join(" ");
}

export function capFirst(str){
    return str[0].toUpperCase()+str.substr(1);
}

export function createOutcomeBranch(state,outcome_id){
    for(let i=0;i<state.outcome.length;i++){
        if(state.outcome[i].id==outcome_id){
            let children;
            if(state.outcome[i].child_outcome_links.length==0 || state.outcome[i].depth >=2)children=[];
            else children = filterThenSortByID(state.outcomeoutcome,state.outcome[i].child_outcome_links).map(outcomeoutcome=>createOutcomeBranch(state,outcomeoutcome.child));

            return {id:outcome_id, children:children};
        }
    }
    return null;
}

/*From the state, creates a tree structure for an outcome*/
export function createOutcomeTree(state){
    let outcomes_tree = [];
    let sorted_outcomes = getSortedOutcomesFromOutcomeWorkflowSet(state,state.workflow.outcomeworkflow_set);
    for(let i=0;i<sorted_outcomes.length;i++){
        let outcomes_tree_category=[];
        for(let j=0;j<sorted_outcomes[i].outcomes.length;j++)
            outcomes_tree_category.push(createOutcomeBranch(state,sorted_outcomes[i].outcomes[j].id));
        outcomes_tree.push({title:sorted_outcomes[i].objectset.title,outcomes:outcomes_tree_category});
    }
    return outcomes_tree;
}

/*From a tree structure of outcomes, flatten the tree*/
export function flattenOutcomeTree(outcomes_tree,array){
    outcomes_tree.forEach(element=>{
        array.push(element.id)
        flattenOutcomeTree(element.children,array);
    });
}

/*Used in the table. Creates a shaped tree-like structure for an outcome and its children that includes each one's relationship to each node.*/
export function createOutcomeNodeBranch(props,outcome_id,nodecategory){
    for(let i=0;i<props.outcome.length;i++){
        if(props.outcome[i].id==outcome_id){
            let children;
            if(props.outcome[i].child_outcome_links.length==0 || props.outcome[i].depth >=2)children=[];
            else children = filterThenSortByID(props.outcomeoutcome,props.outcome[i].child_outcome_links).map(outcomeoutcome=>createOutcomeNodeBranch(props,outcomeoutcome.child,nodecategory));
            let outcomenodes = [];
            for(var ii=0;ii<nodecategory.length;ii++){
                let category = nodecategory[ii];
                let outcomenodes_group=[];
                for(var j=0;j<category.nodes.length;j++){
                    let node = category.nodes[j];
                    let outcomenode = getTableOutcomeNodeByID(props.outcomenode,node,outcome_id).data;
                    if(outcomenode){
                        outcomenodes_group.push({node_id:node,degree:outcomenode.degree});
                        continue;
                    }
                    //If the outcomenode doesn't exist and there are children, check them.
                    let added=false;
                    for(var k=0;k<children.length;k++){
                        if(children[k].outcomenodes[ii][j].degree!==null){
                            outcomenodes_group.push({node_id:node,degree:0});
                            added=true;
                            break;
                        }
                    }
                    if(!added)outcomenodes_group.push({node_id:node,degree:null});
                }
                let total = null;
                if(children.length>0){
                    total = 15;
                    let all_null=true;
                    for(let k=0;k<children.length;k++){
                        var child_total = children[k].outcomenodes[ii].total;
                        if(child_total!==null)all_null=false;
                        total&=child_total;
                    }
                    if(all_null)total=null;
                }else{
                    total = outcomenodes_group.reduce((acc,curr)=>{
                        if(curr.degree===null)return acc;
                        if(acc===null)return curr.degree;
                        return acc|curr.degree;
                    },null);
                }
                outcomenodes_group.total=total;
                outcomenodes.push(outcomenodes_group);
            }
            let total=null;
            if(children.length>0){
                total = 15;
                let all_null=true;
                for(let k=0;k<children.length;k++){
                    var child_total = children[k].outcomenodes.total;
                    if(child_total!==null)all_null=false;
                    total&=child_total;
                }
                if(all_null)total=null;
            }else{
                total = outcomenodes.reduce((acc,curr)=>{
                    if(curr.total===null)return acc;
                    if(acc===null)return curr.total;
                    return acc|curr.total;
                },null);
            }
            outcomenodes.total=total;
            return {id:outcome_id, children:children, outcomenodes:outcomenodes};
        }
    }
    return null;
}

/*Based on an outcomenode's completion status, return the correct icon*/
export function getCompletionImg(completion_status,outcomes_type){
    if(outcomes_type==0 || completion_status & 1){
        return (
            <img class="self-completed" src={iconpath+'solid_check.svg'}/>
        )
    }
    let contents=[];
    if(completion_status & 2){
        let divclass="";
        contents.push(
            <div class={"outcome-introduced outcome-degree"+divclass}>I</div>
        );
    }
    if(completion_status & 4){
        let divclass="";
        contents.push(
            <div class={"outcome-developed outcome-degree"+divclass}>D</div>
        );
    }
    if(completion_status & 8){
        let divclass="";
        contents.push(
            <div class={"outcome-advanced outcome-degree"+divclass}>A</div>
        );
    }
    return contents;

}

// Get the colour from a column
export function getColumnColour(data){
    if(data.colour==null)return default_column_settings[data.column_type].colour;
    else return  "#"+("000000"+data.colour?.toString(16)).slice(-6);
}

// Find and return the best way to display a user's name, username, or email (if that's all we have)
export function getUserDisplay(user){
    let str = "";
    if(user.first_name)str+=user.first_name+" ";
    if(user.last_name)str+=user.last_name+" ";
    if(str=="" && user.username)str+=user.username+" ";
    if(str=="")str=user.email;
    return str;

}

export function permission_translate(){
    return {
        "author":gettext("Owner"),
        "edit":gettext("Editor"),
        "comment":gettext("Commenter"),
        "view":gettext("Viewer"),
    };
};


// Get the little tag that sits in front of usernames signifying the role
export function getUserTag(user_type){
    return (
        <span class={"user-tag permission-"+user_type}>{permission_translate()[user_type]}</span>
    );
}

// Create a loader that fills an element and prevents clicks to it
export class Loader{
    constructor(identifier){
        this.load_screen = $('<div></div>').appendTo(identifier).addClass('load-screen').on('click',(evt)=>{evt.preventDefault();});
    }

    endLoad(){
        this.load_screen.remove();
    }
}

//Check if an object (such as a node or an outcome) should be hidden based on its sets and the currently active object sets
export function checkSetHidden(data,objectsets){
    let hidden=false;
    if(data.sets.length>0 && objectsets){
        hidden=true;
        for(var i=0;i<objectsets.length;i++){
            if(!objectsets[i].hidden && data.sets.indexOf(objectsets[i].id)>=0){
                hidden=false;
                break;
            }
        }
    }
    return hidden;
}

export function csv_safe(unescaped){
    return unescaped.replace(/"/g,'\"\"')
}

export function download(filename, text) {
    var pom = document.createElement('a');
    pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    pom.setAttribute('download', filename);

    if (document.createEvent) {
        var event = document.createEvent('MouseEvents');
        event.initEvent('click', true, true);
        pom.dispatchEvent(event);
    }
    else {
        pom.click();
    }
}

// Do a bit of cleaning to unescape certain characters and display them correctly
export function unescapeCharacters(string){
    return string.replace(/\&amp;/g,"&").replace(/\&gt;/g,">").replace(/\&lt;/g,"<")
}


