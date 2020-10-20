import {h, Component, render, createRef} from "preact";

const columnwidth = 200
var columns;
const node_ports={
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
const port_keys=["n","e","s","w"];

//A utility function to trigger an event on each element. This is used to avoid .trigger, which bubbles (we will be careful to only trigger events on the elements that need them)
export function triggerHandlerEach(trigger,eventname){
    return trigger.each((i,element)=>{$(element).triggerHandler(eventname);});
}

//A proprer modulo function
function mod(n,m){
    return ((n%m)+m)%m;
}

//Debouncing object
class Debouncer{
    constructor(){}
    
    debounce(f, t) {
      return function (args) {
        let previousCall = this.lastCall;
        this.lastCall = Date.now();
        if (previousCall && ((this.lastCall - previousCall) <= t)) {
          clearTimeout(this.lastCallTimer);
        }
        this.lastCallTimer = setTimeout(() => f(args), t);
      }
    }
}

function avgArray(arr1,arr2){
    var arr3=[];
    for(var i=0;i<arr1.length;i++){
        arr3.push((arr1[i]+arr2[i])/2);
    }
    return arr3;
}

function addArray(arr1,arr2){
    var arr3=[];
    for(var i=0;i<arr1.length;i++){
        arr3.push((arr1[i]+arr2[i]));
    }
    return arr3;
}


function subArray(arr1,arr2){
    var arr3=[];
    for(var i=0;i<arr1.length;i++){
        arr3.push((arr1[i]-arr2[i]));
    }
    return arr3;
}

//Extends the preact component to add a few features that are used in a large number of components
export class ComponentJSON extends Component{
    
    //The constructor, by default, creates a reference to "maindiv", which will usually be the root div of the component
    constructor(props){
        super(props);
        this.maindiv = createRef();
    }
    
    //Once the component mounts, it loads the JSON then calls anything in the post-mount function. If the maindiv reference has been defined, we add a backwards reference to this from it, giving us an escape hatch for tricky situations where the state must be altered.
    componentDidMount(){
        const callBackFunction=function(){
            if(this.maindiv.current)this.maindiv.current.react=this;
            this.postMountFunction();
        }
        this.updateJSON({},callBackFunction.bind(this));
            
    }
    
    //Updates the JSON by fetching the json and setting the state, with an option call a function after the state has been set with the new JSON data.
    updateJSON(data,postUpdateFunction){
        var setState=this.setState.bind(this);
        try{
            $.getJSON('/'+this.objectType+"/read/"+this.props.objectID,
                function(json){
                    setState(json,postUpdateFunction);
                }
            );
        }catch(err){}
    }
    
    //Anything that should happen after the 
    postMountFunction(){}
    
    //Directly sets the state, including a call to updateValue to update the value on the server. This should only be used to set things that are not foreign keys/many to many relationships, i.e. only text, integers, booleans, etc. Once the state is set
    setJSON(valuekey,newvalue){
        var newstate = {};
        newstate[valuekey]=newvalue;
        this.setState(newstate,
            ()=>updateValue(this.props.objectID,this.objectType,newstate)
        );
    }
    
    //Adds a button that deltes the item (with a confirmation). The callback function is called after the object is removed from the DOM
    addDeleteSelf(object_id=this.state.id,objectType=this.objectType,callBackFunction){
        return (
            <DeleteSelfButton handleClick={deleteSelf.bind(this,object_id,objectType,()=>{this.props.updateParent({},callBackFunction);})}/>
        );
    }
    
    //Adds a button that inserts a sibling below the item. The callback function unfortunately does NOT seem to be called after the item is added to the DOM
    addInsertSibling(object_id=this.state.id,parent_id=this.props.parentID,objectType=this.objectType,callBackFunction){
        return(
            <InsertSiblingButton handleClick={insertSibling.bind(this,object_id,objectType,parent_id,()=>{this.props.updateParent({},callBackFunction);})}/>
        );
    }
    
    //Makes a sortable object, with a large number of options.
    makeSortable(sortable_block,parent_id,draggable_type,draggable_selector,axis=false,grid=false,connectWith="",handle=false){
        sortable_block.sortable({
            containment:".workflow-container",
            axis:axis,
            cursor:"move",
            grid:grid,
            cursorAt:{top:20},
            connectWith:connectWith,
            handle:handle,
            tolerance:"pointer",
            start:(e,ui)=>{
                $(".workflow-canvas").addClass("dragging");
                $(draggable_selector).addClass("dragging");
                //Calls a refresh of the sortable in case adding the draggable class resized the object (which it does in many cases)
                sortable_block.sortable("refresh");
                //If the handle exists, the item should wrap around it to make it "smaller"
                var sort = $(sortable_block).sortable("instance");
                if(handle){
                    var restriction_handle = $(sort.currentItem).children(handle);
                    restriction_handle=restriction_handle[0];
                    sort.containment[0]-=restriction_handle.offsetLeft;
                    sort.containment[2]+=sort.currentItem[0].offsetWidth-restriction_handle.offsetWidth-restriction_handle.offsetLeft;
                }
                //Fix the vertical containment. This is especially necessary when the item resizes.
                sort.containment[3]+=sort.currentItem[0].offsetTop;
                
            },
            //Tell the dragging object that we are dragging it
            sort:(e,ui)=>{
                $(ui.item[0]).triggerHandler("dragging");
            },
            //Whenever the DOM changes, we tell the siblings
            change:(e,ui)=>{
                triggerHandlerEach($(sortable_block).children(draggable_selector),"sorted");
            },
            //When the object is removed from this list, ensure the state is updated.
            remove:(evt,ui)=>{
                var object_id = ui.item[0].id;
                this.childRemoved.bind(this)(draggable_type,parseInt(object_id));
                triggerHandlerEach($(sortable_block).children(draggable_selector),"sibling-removed");
                triggerHandlerEach($(draggable_selector).not($(sortable_block).children()),"cousin-removed");
            },
            //When the object is received by this list, ensure the state is updated
            receive:(evt,ui)=>{
                var object_id = ui.item[0].id;
                var new_position = $(ui.item[0]).index();
                if(ui.item[0].classList.contains("node-bar-sortable"))this.newChild.bind(this)(draggable_type,parent_id,new_position,ui);
                else this.childAdded.bind(this)(draggable_type,parseInt(object_id),new_position);
                $(sortable_block).children(draggable_selector).triggerHandler("sibling-added");
                triggerHandlerEach($(draggable_selector).not($(sortable_block).children()),"cousin-added");
                
            },
            stop:(evt,ui)=>{
                //Fetch information about the object that was moved
                var object_id = ui.item[0].id;
                var new_position = $(ui.item[0]).index();
                var new_parent_id = parseInt(ui.item[0].parentElement.id);
                //If the object was moved within this list, ensure state update
                if(!new_parent_id||new_parent_id==parent_id)this.childAdded.bind(this)(draggable_type,parseInt(object_id),new_position);
                $(draggable_selector).removeClass("dragging");
                //Automatic scroll, useful when moving weeks that shrink significantly to make sure the dropped item is kept in focus. This should be updated to only scroll if the item ends up outside the viewport, and to scroll the minimum amount to keep it within.
                $("#container").animate({
                    scrollTop: $(ui.item[0]).offset().top-200
                },20);
                //Calculate the horizontal displacement, used for changing columns
                var delta_x = Math.round((ui.position.left-ui.originalPosition.left)/columnwidth);
                var newColumnID=-1;
                //If this is a node, figure out which column it has been moved into and update the state. This is unfortunately a case that's very difficult to do without using our escape hatch to access the react component from the div
                if(draggable_type=="nodestrategy"&&delta_x){
                    var child = ui.item.children(".node");
                    var columnID=child[0].react.state.columnworkflow;
                    try{
                        newColumnID=columns[columns.indexOf(columnID)+delta_x];
                        if(newColumnID){
                            child[0].react.setState({columnworkflow:newColumnID})
                        }
                    }catch(err){console.log("could not change column")}
                }
                //Call the update to the server, with a callback function that triggers an event signifying a change of order
                insertedAt(
                    object_id,
                    draggable_type,
                    parent_id,
                    new_position,
                    new_parent_id,
                    newColumnID,
                    ()=>{
                        triggerHandlerEach($(draggable_selector),"sorted");
                        $(".workflow-canvas").removeClass("dragging");
                    }
                );
            }
        });
    }

    //Remove a child from the state. This is done to keep the state current with the layout. Note we do NOT use setState; it's not necessary (the dom already matches this new state after the drop occurs) and it would create a race condition with the reorder event fired at the end of the sorting.
    childRemoved(object_type,object_id){
        try{
            var array = this.state[object_type+"_set"];
            if(array.indexOf(object_id)>=0)array.splice(array.indexOf(object_id),1);
        }catch(err){}
    }
    
    //Add a child to the state. This is done to keep the state current with the layout. Note we do NOT use setState; it's not necessary (the dom already matches this new state after the drop occurs) and it would create a race condition with the reorder event fired at the end of the sorting.
    childAdded(object_type,object_id,new_position){
        try{
            var array = this.state[object_type+"_set"];
            if(array.indexOf(object_id)>=0)array.splice(array.indexOf(object_id),1);
            array.splice(new_position,0,object_id);
        }catch(err){}
    }

    //Add a new child from drag and drop nodebar, then update the JSON.
    newChild(draggable_type,parent_id,new_position,ui){
        if(draggable_type=="nodestrategy")newNode(parent_id,new_position,ui.item[0].sortableData.column,this.updateJSON.bind(this));
        ui.item.remove()
    }
    
}

//Basic (uneditable) text
export function Text(props){
    return (
        <p>{props.text}</p>
    )
}

//Editable text which calls the textUpdated function passed to it when focus is lost from the input. 
export class ClickEditText extends Component{
    constructor(props){
        super(props);
        this.updateText = this.updateText.bind(this);
    }
    
    render(){
        var text = this.props.text;
        if((this.props.text==null || this.props.text=="") && this.props.defaultText!=null)text=this.props.defaultText;
        this.text = text;
        return (
            <input value={text} onBlur={this.updateText}/>
        )
    }

    updateText(evt){
        var newtext = evt.target.value;
        if(newtext==this.text)return;
        if(newtext=="")newtext=null;
        this.props.textUpdated(evt.target.value);
    }
}

//A button which causes an item to delete itself.
export class DeleteSelfButton extends Component{
    constructor(props){
        super(props);
        this.handleClick = this.handleClick.bind(this);
    }
    
    render(){
        return (
            <button class="delete-self-button" onClick={this.handleClick}>x</button>
        )
    }
    
    handleClick(evt){
        this.props.handleClick(evt);
    }
}


//A button which causes an item to insert a new item below itself.
export class InsertSiblingButton extends Component{
    constructor(props){
        super(props);
        this.handleClick = this.handleClick.bind(this);
    }
    
    render(){
        return (
            <button class="insert-sibling-button" onClick={this.handleClick}>+</button>
        )
    }
    
    handleClick(evt){
        this.props.handleClick(evt);
    }
}

//Get translate from an svg transform
function getSVGTranslation(transform){
    var translate = transform.substring(transform.indexOf("translate(")+10, transform.indexOf(")")).split(",");
    return translate;
}

//Get the offset from the canvas of a specific jquery object
function getCanvasOffset(node_dom){
    var node_offset = node_dom.offset();
    var canvas_offset = $(".workflow-canvas").offset();
    node_offset.left-=canvas_offset.left;
    node_offset.top-=canvas_offset.top;
    return node_offset;
}

export class NodeLinkSVG{
    constructor(namespace,source,target,source_port=2,target_port=0){
        this.svg = d3.select(".workflow-canvas").append("path").attr("stroke","red").attr("stroke-width","3px");
        this.source=source;
        this.target=target;
        this.source_port=source_port;
        this.target_port=target_port;
        this.debouncer = new Debouncer();
        this.source_node = $("#"+source+".node");
        this.source_port_handle = d3.select(
            "g.port-"+source+" circle[data-port-type='source'][data-port='"+port_keys[source_port]+"']"
        );
        this.source_node.on("dragging sibling-added sibling-removed sorted dragging",this.rerender.bind(this));
        if(this.target){
            this.setTarget(this.target);
        }else{
            this.findAutoTarget();
        }
        if(this.target_node)this.drawSVG();
        this.eventNameSpace=namespace;
    }
    
    setTarget(target){
        if(target){
            if(this.target_node&&target==this.target_node.attr("id"))return;
            
            if(this.target_node)this.target_node.off(this.getRerenderEvents());
            this.target_node = $("#"+target+".node");
            this.target_port_handle = d3.select(
                "g.port-"+target+" circle[data-port-type='target'][data-port='"+port_keys[this.target_port]+"']"
            );
            this.target_node.on(this.getRerenderEvents(),this.rerender.bind(this));
            if(this.target)this.target=target;
        }else{
            if(this.target_node)this.target_node.off(this.getRerenderEvents());
            this.target_node==null;
            this.target_port_handle==null;
        }
    }
    
    getRerenderEvents(){
        return "dragging."+this.eventNameSpace+
                " sibling-added."+this.eventNameSpace+
                " sibling-removed."+this.eventNameSpace+
                " sorted."+this.eventNameSpace+
                " dragging."+this.eventNameSpace;
    }
    
    findAutoTarget(){
        var ns = this.source_node.closest(".node-strategy");
        var next_ns = ns.next();
        var target;
        if(next_ns.length>0){
            target = next_ns.find(".node").attr("id");
        }else{
            var sw = ns.closest(".strategy-workflow");
            var next_sw = sw.next();
            if(next_sw.length>0){
                target = next_sw.find(".node").attr("id");
            }
        }
        console.log(target);
        this.setTarget(target);
    }
    
    rerender(){
        if(!this.target)this.findAutoTarget();
        if(this.target_node)this.drawSVG();
        else this.hideSVG();
    }
     
    drawSVG(){
        const source_transform=getSVGTranslation(this.source_port_handle.select(function(){return this.parentNode}).attr("transform"));
        const target_transform=getSVGTranslation(this.target_port_handle.select(function(){return this.parentNode}).attr("transform"));
        const source_points=[[parseInt(this.source_port_handle.attr("cx"))+parseInt(source_transform[0]),parseInt(this.source_port_handle.attr("cy"))+parseInt(source_transform[1])]];
        const target_points=[[parseInt(this.target_port_handle.attr("cx"))+parseInt(target_transform.[0]),parseInt(this.target_port_handle.attr("cy"))+parseInt(target_transform[1])]];
        
        var path = this.getPath(source_points,target_points);
        this.svg.attr("d",path);
        
        /*
        var parent_rect = $(".workflow-canvas").offset();
        const w1 = this.sourcenode.width();
        const h1 = this.sourcenode.height();
        const w2 = this.targetnode.width();
        const h2 = this.targetnode.height();
        var source_rect = this.sourcenode.offset();
        var target_rect = this.targetnode.offset();
        const c1 = [source_rect.left+w1/2,source_rect.top+h1/2];
        const c2 = [target_rect.left+w2/2,target_rect.top+h2/2];
        //const d1 = subArray(c2,c1);
        //const d2 = subArray(c1,c2);

        const source_points = [[w1/2*(source_port%2)*(-1)**(Math.floor(source_port/2)),h1/2*((source_port+1)%2)*(-1)**(Math.floor((source_port+2)/2))]];
        const target_points = [[w1/2*(target_port%2)*(-1)**(Math.floor(target_port/2)),h1/2*((target_port+1)%2)*(-1)**(Math.floor((target_port+2)/2))]];*/
         
    }
    
    hideSVG(){
        console.log("hide svg");
        this.svg.attr("d","");
    }
    
     
    /*
    checkValid(v1,v2,d){
        console.log("checking whether valid");
        console.log(v1);
        console.log(v2);
        console.log(d);
        var vd = addArray(v2,d);
        console.log(Math.sign(v1[0]*vd[0])>=0&&Math.sign(v1[1]*vd[1])>=0)
        return (Math.sign(v1[0]*vd[0])>=0&&Math.sign(v1[1]*vd[1])>=0);
        
        
        return (Math.sign(v1[0])*Math.sign(vd[0]))
    }
    
    getDirection(v1,v2){
        console.log("Getting the direction");
        var dir = Math.sign(v1[0]*v2[1]-v1[1]*v2[0]);
        console.log(v1);
        console.log(v2);
        console.log("dir = "+dir);
        if(dir==0)return 1;
        return dir;
    }*/
    
    /*Ignore for now
    walkAround(){
            var source_point_found=false;
            var source_point=0;
            var target_point_found=false;
            var target_point=0;
            
            for(var i=source_port;i<source_port+4;i++){
                source_points.push([w1/2*(-1)**(Math.floor(i/2)),h1/2*(-1)**Math.floor((i+3)/2)]);
            }
            for(var i=target_port;i<target_port+4;i++){
                target_points.push([w2/2*(-1)**(Math.floor(i/2)),h2/2*(-1)**Math.floor((i+3)/2)]);
            }
            console.log(source_points);
            console.log(target_points);
            var target_point_array=[target_points[0]];
            var source_point_array=[source_points[0]];
            var counter=0;
            do{
                counter++;
                if(counter==10)break;
                source_point_found = this.checkValid(
                    source_points[source_point],
                    target_points[target_point],
                    d1
                );
                target_point_found = this.checkValid(
                    target_points[target_point],
                    source_points[source_point],
                    d2
                );
                if(!source_point_found){
                    console.log("source has not been found. Getting the direction.");
                    source_point=mod(source_point+
                        this.getDirection(
                        source_points[source_point],
                        addArray(target_points[target_point],d1))
                    ,5);
                    console.log(source_point);
                    var thispoint = source_points[source_point];
                    source_point_array.push([thispoint[0]+Math.sign(thispoint[0])*10,thispoint[1]+Math.sign(thispoint[1])*10]);
                }else if(!target_point_found){
                    console.log("target has not been found. Getting the direction.");
                    target_point=mod(target_point+
                        this.getDirection(
                        target_points[target_point],
                        addArray(source_points[source_point],d2))
                    ,5);
                    console.log(target_point);
                    var thispoint = target_points[target_point];
                    target_point_array.push([thispoint[0]+Math.sign(thispoint[0])*10,thispoint[1]+Math.sign(thispoint[1])*10]);
                }
            }while(!(source_point_found&&target_point_found))
    }*/
    
    getPath(source_point_array,target_point_array){
        var path="M";
        for(var i=0;i<source_point_array.length;i++){
            if(i>0)path+=" L";
            var thispoint = source_point_array[i];
            path+=thispoint[0]+" "+thispoint[1];
        }
        for(var i=target_point_array.length-1;i>=0;i--){
            path+=" L";
            var thispoint = target_point_array[i];
            path+=thispoint[0]+" "+thispoint[1];
        }
        return path;
    }
}

//Basic component to represent a NodeLink
export class NodeLinkView extends ComponentJSON{
    constructor(props){
        super(props);
        this.objectType="nodelink";
    }
    
    
    render(){
    }
    
    postMountFunction(){
        this.svg = new NodeLinkSVG("nodelink"+this.state.id,this.state.source_node,this.state.target_node,this.state.source_port,this.state.target_port);
    }
        
       
}

//Basic component to represent a Node
export class NodeView extends ComponentJSON{
    constructor(props){
        super(props);
        this.objectType="node";
        var nodesvg = d3.select(".workflow-canvas").append("g").attr("stroke","black").attr("fill","white").attr("stroke-width",2).attr("class",'node-ports port-'+props.objectID);
        for(var port_type in node_ports)for(var port in node_ports[port_type]){
            nodesvg.append("circle").attr("data-port-type",port_type).attr("data-port",port).attr("r",5);
        }
    }
    
    render(){
        if(this.state.id){
            var node_links = this.state.outgoing_links.map((link)=>
                <NodeLinkView key={link} objectID={link} parentID={this.state.id} updateParent={this.updateJSON.bind(this)}/>
            );
            //Note the use of columnworkflow rather than column to determine the css rule that gets applied. This is because the horizontal displacement is based on the rank of the column, which is a property of the columnworkflow rather than of the column itself
            return (
                <div class={"node column-"+this.state.columnworkflow}  id={this.state.id} ref={this.maindiv}>
                        <ClickEditText text={this.state.title} defaultText="New Node" textUpdated={this.setJSON.bind(this,"title")}/>
                        <ClickEditText text={this.state.description} textUpdated={this.setJSON.bind(this,"description")}/>
                        {node_links}
                </div>
            );
        }
    }
    
    updatePorts(){
        var node = $(this.maindiv.current);
        var node_offset = getCanvasOffset(node);
        d3.select('g.port-'+this.props.objectID)
            .attr("transform","translate("+node_offset.left+","+node_offset.top+")");
    }

    placePorts(){
        var node = $(this.maindiv.current);
        var node_dimensions={width:node.width(),height:node.height()};
        d3.selectAll(
            'g.port-'+this.props.objectID+" circle"
        ).datum(node_dimensions).each(function(d){
            var myd3 = d3.select(this);
            var port_position = node_ports[myd3.attr("data-port-type")][myd3.attr("data-port")];
            myd3.attr(
                "cx",port_position[0]*d.width
            ).attr(
                "cy",port_position[1]*d.height
            );
        });
        this.updatePorts();
        
        
    }

    postMountFunction(){
        if(this.maindiv.current){
            this.placePorts();
            $(this.maindiv.current).on("sorted",this.updatePorts.bind(this));
            if(this.state.has_autolink)this.svg = new NodeLinkSVG("nodeautolink"+this.state.id,this.state.id);
        }
    }
}

//Basic component to represent a NodeStrategy
export class NodeStrategyView extends ComponentJSON{
    constructor(props){
        super(props);
        this.objectType="nodestrategy";
    }
    
    render(){
        if(this.state.id){
            return (
                <div class="node-strategy" id={this.state.id} ref={this.maindiv}>
                    <NodeView objectID={this.state.node}/>
                </div>
            );
        }
    }
    
    passEventToChild(evt){
        $(this.maindiv.current).children(".node").triggerHandler(evt.type)
    }
    
    postMountFunction(){
        if(this.maindiv.current){
            //Add an event listener to check for reorderings of node-strategies, updating the rank if needed
            var node_strategy=this;
            $(this.maindiv.current).on("sorted sibling-added sibling-removed",this.updateRank.bind(this));
            $(this.maindiv.current).on("sibling-added sibling-removed cousin-added cousin-removed sorted dragging",(evt)=>{node_strategy.passEventToChild(evt)});
        }
    }

    //Updates the rank in the state if needed
    updateRank(){
        var index = $(this.maindiv.current).index();
        if(this.state.rank!=index)this.setState({rank:index});
    }
}

//Basic component to represent a Strategy
export class StrategyView extends ComponentJSON{
    constructor(props){
        super(props);
        this.objectType="strategy"
        
    }
    
    render(){
        if(this.state.id){
            var nodes = this.state.nodestrategy_set.map((nodestrategy)=>
                <NodeStrategyView key={nodestrategy} objectID={nodestrategy} parentID={this.state.id} updateParent={this.updateJSON.bind(this)}/>
            );
            return (
                <div class="strategy">
                        <ClickEditText text={this.state.title} defaultText={this.state.strategy_type_display+" "+(this.props.rank+1)} textUpdated={this.setJSON.bind(this,"title")}/>
                        <ClickEditText text={this.state.description} textUpdated={this.setJSON.bind(this,"description")}/>
                        <button onClick={()=>newNode(this.state.id,-1,-1,this.updateJSON.bind(this))}>Add A Node</button>
                        <div class="node-block" id={this.props.objectID+"-node-block"} ref={this.maindiv}>
                            {nodes}
                        </div>
                </div>
            );
        }
    }
    
    postMountFunction(){
        //Makes the nodestrategies in the node block sortable, linking them with other node blocks
        this.makeSortable($(this.maindiv.current),
                          this.props.objectID,
                          "nodestrategy",
                          ".node-strategy",
                          false,
                          [200,10],
                          ".node-block",
                          ".node");
    }
    
}

//Basic component to represent a column
export class ColumnView extends ComponentJSON{
    constructor(props){
        super(props);
        this.objectType="column";
    }
    
    render(){
        if(this.state.id){
            var title = this.state.title;
            if(!title)title=this.state.column_type_display;
            return (
                <div class="column">
                    {title}
                </div>
            );
        }
    }
}

//Basic component to represent a columnworkflow
export class ColumnWorkflowView extends ComponentJSON{
    constructor(props){
        super(props);
        this.objectType="columnworkflow";
        //We add a style to the header to represent the column
        $("<style>").prop("type","text/css").prop("id","column-"+this.props.objectID+"-CSS").appendTo("head");
    }
    
    render(){
        if(this.state.id){
            this.updateCSS()
            return (
                <div class={"column-workflow column-"+this.state.id} id={this.state.id} ref={this.maindiv}>
                    <ColumnView objectID={this.state.column}/>
                    {this.addDeleteSelf(this.state.column,"column",()=>$(".column-workflow").trigger("columnworkflow-reordered"))}
                </div>
            );
        }else return(
            <div class={"column-workflow column-"+this.state.id}></div>
        )
    }

    passEventToChild(evt){
        $(this.maindiv.current).children(".column").triggerHandler(evt.type)
    }
    
    postMountFunction(){
        if(this.maindiv.current){
            $(".column-workflow").trigger("sibling-added");
            //add event listener to check for reordering of columnworkflows, updating hte rank
            var column_workflow=this;
            $(this.maindiv.current).on("sorted sibling-added sibling-removed",this.updateRank.bind(this));
            $(this.maindiv.current).on("sibling-added sibling-removed cousin-added cousin-removed sorted dragging",(evt)=>{column_workflow.passEventToChild(evt)});
        }
    }

    //Updates the css rule for the column. This gets called whenever the state changes (through the re-render), so that when the rank changes the css rule gets updated
    updateCSS(){
        $("#column-"+this.props.objectID+"-CSS").html(".column-"+this.props.objectID+"{left:"+this.calcDistance()+"px}");
    }
    
    updateRank(){
        //Updates the rank. Note this will call a re-rendering, which will itself call updateCSS()
        var index = $(this.maindiv.current).index();
        if(this.state.rank!=index)this.setState({rank:index});
    }
    
    //Used to calculate the distance of the column from the left, based on the current rank
    calcDistance(){
        return columnwidth*this.state.rank
    }
}

//Basic strategyworkflow component
export class StrategyWorkflowView extends ComponentJSON{
    constructor(props){
        super(props);
        this.objectType="strategyworkflow";
    }
    
    render(){
        if(this.state.id){
            return (
                <div class="strategy-workflow" id={this.state.id} ref={this.maindiv}>
                    <StrategyView objectID={this.state.strategy} rank={this.state.rank}/>
                    {this.addDeleteSelf(this.state.strategy,"strategy",()=>$(".strategy-workflow").trigger("strategyworkflow-reordered"))}
                    {this.addInsertSibling(this.state.id,this.props.parentID,"strategyworkflow")}
                </div>
            );
        }
    }

    passEventToChild(evt){
        $(this.maindiv.current).children(".strategy").triggerHandler(evt.type)
    }

    postMountFunction(){
        if(this.maindiv.current){
            //Trigger the reordering event, which will make all other strategyworkflows update their indices in their states. This is critical for when a new strategy is inserted, because the DOM has not fully updated until this post-mount function is called. Note this event also gets fired a bunch of times on the initial load, but the strategies don't get re-rendered because setState is only called if the index has changed.
            $(".strategy-workflow").trigger("sibling-added");
            //Add an eventlistener to listen for reordering events
            var strategy_workflow=this;
            $(this.maindiv.current).on("sorted sibling-added sibling-removed",this.updateRank.bind(this));
            $(this.maindiv.current).on("sibling-added sibling-removed cousin-added cousin-removed sorted dragging",(evt)=>{strategy_workflow.passEventToChild(evt)});
        }
    }

    //Updates the rank based on the index
    updateRank(){
        var index = $(this.maindiv.current).index();
        if(this.state.rank!=index)this.setState({rank:index});
    }



    
}

//Basic component representing the workflow
export class WorkflowView extends ComponentJSON{
    
    constructor(props){
        super(props);
        this.objectType=props.type;
    }
    
    render(){
        if(this.state.id){
            var columnworkflows = this.state.columnworkflow_set.map((columnworkflow)=>
                <ColumnWorkflowView key={columnworkflow} objectID={columnworkflow} parentID={this.state.id} updateParent={this.updateJSON.bind(this)}/>
            );
            var strategyworkflows = this.state.strategyworkflow_set.map((strategyworkflow)=>
                <StrategyWorkflowView key={strategyworkflow} objectID={strategyworkflow} parentID={this.state.id} updateParent={this.updateJSON.bind(this)}/>
            );

            return (
                <div id="workflow-wrapper" class="workflow-wrapper">
                    <div class = "workflow-container">
                        <ClickEditText text={this.state.title} textUpdated={this.setJSON.bind(this,"title")}/>
                        <Text text={"Created by "+this.state.author}/>
                        <ClickEditText text={this.state.description} textUpdated={this.setJSON.bind(this,"description")}/>
                        <button onClick={()=>newColumn(this.state.id,0,this.updateJSON.bind(this))}>Add A Column</button>
                        <div class="column-row">
                            {columnworkflows}
                        </div>
                        <div class="strategy-block">
                            {strategyworkflows}
                        </div>
                    <svg class="workflow-canvas" width="100%" height="100%"></svg>
                    </div>
                </div>
            );
        }
    }
    
    //Makes both the strategy-block and the column-row sortable
    postMountFunction(){
        this.makeSortable($(".strategy-block"),
                          this.props.objectID,
                          "strategyworkflow",
                          ".strategy-workflow",
                          "y");
        this.makeSortable($(".column-row"),
                          this.props.objectID,
                          "columnworkflow",
                          ".column-workflow",
                          "x");
    }
    
    //Keeps the column ordering updated
    componentDidUpdate(){
        if(this.state){
            columns=this.state.columnworkflow_set;
        }
    }   
}

//Class to represent the nodebar for a workflow
export class NodeBarWorkflowView extends ComponentJSON{
    constructor(props){
        super(props);
        this.objectType=props.type;
    }
    
    render(){
        if(this.state.id){
            var columnworkflows = this.state.columnworkflow_set.map((columnworkflow)=>
                <NodeBarColumnWorkflowView key={columnworkflow} objectID={columnworkflow}/>
            );
            var strategyworkflows = this.state.strategyworkflow_set.map((strategyworkflow)=>
                <NodeBarStrategyWorkflowView key={strategyworkflow} objectID={strategyworkflow}/>
            );
            
            return(
                <div id="node-bar-workflow" class="node-bar-workflow" ref={this.maindiv}>
                    <div class="node-bar-column-block">
                        {columnworkflows}
                    </div>
                    <div class="node-bar-strategy-block">
                        {strategyworkflows}
                    </div>
                </div>
            );
        }
    }
    
    postMountFunction(){
        $(this.maindiv.current.parentElement).resizable({
            containment:"body",
        });
    }
}

//Class to represent the nodebar's "columns" (used to drag nodes into the strategies)
export class NodeBarColumnWorkflowView extends ComponentJSON{
    constructor(props){
        super(props);
        this.objectType="columnworkflow";
    }
    
    render(){
        if(this.state.id){
            return(
                <div class="node-bar-column-workflow" ref={this.maindiv}>
                    <NodeBarColumnView objectID={this.state.column}/>
                </div>
            );
        }
    }
    
    postMountFunction(){
        if(this.maindiv.current){
            $(this.maindiv.current).sortable({
                connectWith:".node-block",
                helper:(evt,div)=>{
                    this.maindiv.current.copyHelper = div.clone().insertAfter(div);
                    return div.clone().appendTo(document.body);
                },
                containment:".workflow-container",
                start:(event,ui)=>{
                    ui.item[0].sortableData={column:this.state.column};
                },
                stop:(event,ui)=>{
                    if(ui.item[0].parentElement&&ui.item[0].parentElement.classList.contains("node-bar-column-workflow")){
                        ui.item.remove();
                    }
                    
                }
            });
        }
    }
    
}

export class NodeBarColumnView extends ComponentJSON{
    constructor(props){
        super(props);
        this.objectType="column";
    }
    
    render(){
        if(this.state){
            var title = this.state.title;
            if(!title)title=this.state.column_type_display;
            return(
                <div class="node-bar-column node-bar-sortable">
                    {title}
                </div>
            );
        }
    }
}

export class NodeBarStrategyWorkflowView extends ComponentJSON{
    constructor(props){
        super(props);
        this.objectType="strategyworkflow";
    }
    
    render(){
        
    }
}

export function renderWorkflowView(workflow,container){
    render(<WorkflowView objectID={workflow.id} type={workflow.type}/>,container);
}
           
export function renderNodeBar(workflow,container){
    render(<NodeBarWorkflowView objectID={workflow.id} type={workflow.type}/>,container);
}
