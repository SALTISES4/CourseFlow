import {h, Component, render, createRef} from "preact";

const columnwidth = 200
var columns;


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
                    console.log("Fetch returned json:");
                    console.log(json);
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
            //When the object is removed from this list, ensure the state is updated.
            remove:(evt,ui)=>{
                var object_id = ui.item[0].id;
                this.childRemoved.bind(this)(draggable_type,parseInt(object_id));
            },
            //When the object is received by this list, ensure the state is updated
            receive:(evt,ui)=>{
                console.log("firing receive");
                console.log(ui);
                console.log(evt);
                var object_id = ui.item[0].id;
                var new_position = $(ui.item[0]).index();
                if(ui.item[0].classList.contains("node-bar-sortable"))this.newChild.bind(this)(draggable_type,parent_id,new_position,ui);
                else this.childAdded.bind(this)(draggable_type,parseInt(object_id),new_position);
            },
            stop:(evt,ui)=>{
                console.log("firing stop");
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
                    ()=>$(draggable_selector).trigger(draggable_type+"-reordered")
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
        console.log(new_position);
        console.log(parent_id);
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

//Basic component to represent a Node
export class NodeView extends ComponentJSON{
    constructor(props){
        super(props);
        this.objectType="node";
    }
    
    render(){
        if(this.state.id){
            //Note the use of columnworkflow rather than column to determine the css rule that gets applied. This is because the horizontal displacement is based on the rank of the column, which is a property of the columnworkflow rather than of the column itself
            return (
                <div class={"node column-"+this.state.columnworkflow} ref={this.maindiv}>
                        <ClickEditText text={this.state.title} defaultText="New Node" textUpdated={this.setJSON.bind(this,"title")}/>
                        <ClickEditText text={this.state.description} textUpdated={this.setJSON.bind(this,"description")}/>
                </div>
            );
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
    
    
    postMountFunction(){
        if(this.maindiv.current){
            //Add an event listener to check for reorderings of node-strategies, updating the rank if needed
            $(this.maindiv.current).on("nodestrategy-reordered",this.updateRank.bind(this));
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
                        <button onClick={()=>newNode(this.state.id,-1,columns[columns.length-1],this.updateJSON.bind(this))}>Add A Node</button>
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
                          [200,1],
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

    postMountFunction(){
        if(this.maindiv.current){
            $(".column-workflow").trigger("columnworkflow-reordered");
            //add event listener to check for reordering of columnworkflows, updating hte rank
            $(this.maindiv.current).on("columnworkflow-reordered",this.updateRank.bind(this));
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

    postMountFunction(){
        if(this.maindiv.current){
            //Trigger the reordering event, which will make all other strategyworkflows update their indices in their states. This is critical for when a new strategy is inserted, because the DOM has not fully updated until this post-mount function is called. Note this event also gets fired a bunch of times on the initial load, but the strategies don't get re-rendered because setState is only called if the index has changed.
            $(".strategy-workflow").trigger("strategyworkflow-reordered");
            //Add an eventlistener to listen for reordering events
            $(this.maindiv.current).on("strategyworkflow-reordered",this.updateRank.bind(this));
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
