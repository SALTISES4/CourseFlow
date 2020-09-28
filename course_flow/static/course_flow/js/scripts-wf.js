import {h, Component, render} from "preact";


export class ComponentJSON extends Component{
    constructor(props){
        super(props);
        this.json = props.json;
        this.state = this.json;
    }
    
    setJSON(newstate){
        mergeObjects(this.json,newstate);
        this.setState(newstate);
    }
}


function mergeObjects(target,source){
    console.log(target);
    console.log(source);
    for(var prop in source){
        console.log(prop);
        if(typeof target[prop] === 'object' && target[prop]!=null)mergeObjects(target[prop],source[prop]);
        else target[prop]=source[prop];
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
        console.log(this);
        console.log("Updating text");
        console.log(evt.target.value);
        this.props.textUpdated(evt.target.value);
    }
}

export class NodeView extends ComponentJSON{
    
    render(){
        return (
            <div class="node">
                <ClickEditText text={this.state.node.title}/>
            </div>
        );
    }
    

}

export class ColumnView extends ComponentJSON{
    
    
    render(){
        return (
            <div class="column">
                {this.state.column.title}
            </div>
        );
    }
}

export class StrategyView extends ComponentJSON{
    
    
    render(){
        console.log(this.state);
        var nodes = this.state.strategy.nodestrategy_set.map((node)=>
            <NodeView json={node}/>
        );
        return (
            <div class="strategy">
                {this.state.strategy.title}
                <div>
                    {nodes}
                </div>
            </div>
        );
    }
}

export class WorkflowView extends ComponentJSON{
    
    titleChanged(title){
        console.log("The new title is: "+title);
        this.setState({title:title});
        console.log(this.state);
    }
    
    render(){
        console.log(this.state)
        var columns = this.state.columnworkflow_set.map((column)=>
            <ColumnView json={column}/>
        );
        var strategies = this.state.strategyworkflow_set.map((strategy)=>
            <StrategyView json={strategy}/>
        );
        
        return (
            <div id="workflow-wrapper" class="workflow-wrapper">
                <div class = "workflow-container">
                    <ClickEditText text={this.state.title} textUpdated={this.titleChanged.bind(this)}/>
                    <Text text={"Created by "+this.state.author}/>
                    <ClickEditText text={this.state.description}/>
                    <div class="column-row">
                        {columns}
                    </div>
                    <div class="strategy-block">
                        {strategies}
                    </div>
                </div>
            </div>
        );
    }
}


export function renderWorkflowView(workflow,container){
    render(<WorkflowView json={workflow}/>,container)
}
