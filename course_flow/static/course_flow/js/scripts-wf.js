import {h, Component, render, createRef} from "preact";

export class ComponentJSON extends Component{
    
    constructor(props){
        super(props);
    }
    
    componentDidMount(){
        this.updateJSON({},this.postMountFunction.bind(this));
    }
    
    updateJSON(data,postUpdateFunction){
        var setState=this.setState.bind(this);
        $.getJSON('/'+this.objectType+"/read/"+this.props.objectID,
            function(json){
                setState(json,postUpdateFunction);
            }
        );
    }
    
    postMountFunction(){}
    
    setJSON(valuekey,newvalue){
        //if(this.state[valuekey]==newvalue)return;
        var newstate = {};
        newstate[valuekey]=newvalue;
        this.setState(newstate,
            ()=>updateValue(this.props.objectID,this.objectType,this.state)
        );
    }
    
    addDeleteSelf(object_id=this.state.id,objectType=this.objectType){
        return (
            <DeleteSelfButton handleClick={deleteSelf.bind(this,object_id,objectType,this.props.updateParent)}/>
        );
    }
    
    addInsertSibling(object_id=this.state.id,parent_id=this.props.parentID,objectType=this.objectType){
        return(
            <InsertSiblingButton handleClick={insertSibling.bind(this,object_id,objectType,parent_id,this.props.updateParent)}/>
        );
    }
    
    makeSortable(sortable_block,parent_id,draggable_type,draggable_selector,refresh_trigger,axis=false,connectWith=""){
        sortable_block.sortable({
            revert:100,
            containment:".workflow-container",
            axis:axis,
            cursor:"move",
            cursorAt:{left:10,top:50},
            connectWith:connectWith,
            start:()=>{
                $(draggable_selector).addClass("dragging");
                sortable_block.sortable("refresh");
            },
            stop:(evt,ui)=>{
                $(draggable_selector).removeClass("dragging");
                $("#container").animate({
                    scrollTop: $(ui.item[0]).offset().top-200
                },20);
                insertedAt(
                    ui.item[0].id,
                    draggable_type,
                    parent_id,
                    $(ui.item[0]).index(),
                    ui.item[0].parentElement.id,
                    ()=>$(draggable_selector).trigger(refresh_trigger)
                );
            }
        });
    }
    
}

export function Text(props){
    return (
        <p>{props.text}</p>
    )
}


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

export class NodeView extends ComponentJSON{
    constructor(props){
        super(props);
        this.objectType="node";
    }
    
    render(){
        if(this.state.id){
            return (
                <div class="node">
                        <ClickEditText text={this.state.title} defaultText="New Node" textUpdated={this.setJSON.bind(this,"title")}/>
                        <ClickEditText text={this.state.description} textUpdated={this.setJSON.bind(this,"description")}/>
                </div>
            );
        }
    }
}

export class NodeStrategyView extends ComponentJSON{
    constructor(props){
        super(props);
        this.objectType="nodestrategy";
        this.maindiv = createRef();
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
            $(this.maindiv.current).on("refresh-node-strategies",this.updateJSON.bind(this));
        }
    }
}

export class StrategyView extends ComponentJSON{
    constructor(props){
        super(props);
        this.objectType="strategy"
        this.maindiv = createRef();
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
                        <button onClick={()=>newNode(this.state.id,this.updateJSON.bind(this))}>Add A Node</button>
                        <div class="node-block" id={this.props.objectID+"-node-block"} ref={this.maindiv}>
                            {nodes}
                        </div>
                </div>
            );
        }
    } 
    
    postMountFunction(){
        this.makeSortable($(this.maindiv.current),
                          this.props.objectID,
                          "nodestrategy",
                          ".node-strategy",
                          "refresh-node-strategies",
                          "y",
                          ".node-block");
    }
}

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

export class ColumnWorkflowView extends ComponentJSON{
    constructor(props){
        super(props);
        this.objectType="columnworkflow";
        this.maindiv = createRef();
    }
    
    render(){
        if(this.state.id){
            return (
                <div class="column-workflow" id={this.state.id} ref={this.maindiv}>
                    <ColumnView objectID={this.state.column}/>
                    {this.addDeleteSelf(this.state.column,"column")}
                </div>
            );
        }
    }

    postMountFunction(){
        if(this.maindiv.current){
            $(this.maindiv.current).on("refresh-column-workflows",this.updateJSON.bind(this));
        }
    }
}

export class StrategyWorkflowView extends ComponentJSON{
    constructor(props){
        super(props);
        this.objectType="strategyworkflow";
        this.maindiv = createRef();
    }
    
    render(){
        if(this.state.id){
            return (
                <div class="strategy-workflow" id={this.state.id} ref={this.maindiv}>
                    <StrategyView objectID={this.state.strategy} rank={this.state.rank}/>
                    {this.addDeleteSelf(this.state.strategy,"strategy")}
                    {this.addInsertSibling()}
                </div>
            );
        }
    }

    postMountFunction(){
        if(this.maindiv.current){
            $(this.maindiv.current).on("refresh-strategy-workflows",this.updateJSON.bind(this));
        }
    }



    
}

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
    
    postMountFunction(){
        this.makeSortable($(".strategy-block"),
                          this.props.objectID,
                          "strategyworkflow",
                          ".strategy-workflow",
                          "refresh-strategy-workflows",
                          "y");
        this.makeSortable($(".column-row"),
                          this.props.objectID,
                          "columnworkflow",
                          ".column-workflow",
                          "refresh-column-workflows",
                          "x");
    }

    
    
}

export function renderWorkflowView(workflow,container){
    render(<WorkflowView objectID={workflow.id} type={workflow.type}/>,container)
}
