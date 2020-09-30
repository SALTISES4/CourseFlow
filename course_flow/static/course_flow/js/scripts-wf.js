import {h, Component, render} from "preact";


export class ComponentJSON extends Component{
    
    constructor(props){
        super(props);
        console.log(props);
    }
    
    componentDidMount(){
        var setState=this.setState.bind(this);
        
        $.getJSON('/'+this.objectType+"/read/"+this.props.objectID,
            function(json){
                setState(json);
            }
        );
    }
    
    setJSON(valuekey,newvalue){
        if(this.state[valuekey]==newvalue)return;
        var newstate = {};
        newstate[valuekey]=newvalue;
        console.log(this);
        this.setState(newstate,
            ()=>updateValue(this.props.objectID,this.objectType,this.state)
        );
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
        return (
            <input value={this.props.text} onBlur={this.updateText}/>
        )
    }

    updateText(evt){
        this.props.textUpdated(evt.target.value);
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
                        <ClickEditText text={this.state.title} textUpdated={this.setJSON.bind(this,"title")}/>
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
    }
    
    render(){
        if(this.state.id){
            return (
                <NodeView objectID={this.state.node}/>
            );
        }
    }
}

export class StrategyView extends ComponentJSON{
    constructor(props){
        super(props);
        this.objectType="strategy"
    }
    
    render(){
        if(this.state.id){
            var nodes = this.state.nodestrategy_set.map((nodestrategy)=>
                <NodeStrategyView objectID={nodestrategy}/>
            );
            return (
                <div class="strategy">
                        <ClickEditText text={this.state.title} textUpdated={this.setJSON.bind(this,"title")}/>
                        <ClickEditText text={this.state.description} textUpdated={this.setJSON.bind(this,"description")}/>
                    <div>
                        {nodes}
                    </div>
                </div>
            );
        }
    }
}

export class ColumnView extends ComponentJSON{
    constructor(props){
        super(props);
        this.objectType="column";
    }
    
    render(){
        if(this.state.id){
            console.log(this.state);
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
    }
    
    render(){
        if(this.state.id){
            return (
                <ColumnView objectID={this.state.column}/>
            );
        }
    }
}

export class StrategyWorkflowView extends ComponentJSON{
    constructor(props){
        super(props);
        this.objectType="strategyworkflow";
    }
    
    render(){
        console.log(this.state)
        if(this.state.id){
            return (
                <StrategyView objectID={this.state.strategy}/>
            );
        }
    }
}

export class WorkflowView extends ComponentJSON{
    
    constructor(props){
        super(props);
        this.objectType=props.type;
    }
    
    render(){
        console.log(this.state);
        if(this.state.id){
            var columnworkflows = this.state.columnworkflow_set.map((columnworkflow)=>
                <ColumnWorkflowView objectID={columnworkflow}/>
            );
            var strategyworkflows = this.state.strategyworkflow_set.map((strategyworkflow)=>
                <StrategyWorkflowView objectID={strategyworkflow}/>
            );

            return (
                <div id="workflow-wrapper" class="workflow-wrapper">
                    <div class = "workflow-container">
                        <ClickEditText text={this.state.title} textUpdated={this.setJSON.bind(this,"title")}/>
                        <Text text={"Created by "+this.state.author}/>
                        <ClickEditText text={this.state.description} textUpdated={this.setJSON.bind(this,"description")}/>
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
}

export function renderWorkflowView(workflow,container){
    console.log(workflow);
    render(<WorkflowView objectID={workflow.id} type={workflow.type}/>,container)
}
