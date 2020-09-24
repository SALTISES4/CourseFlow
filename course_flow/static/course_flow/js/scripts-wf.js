import {h, Component, render} from "preact";


export function Text(props){
    return (
        <p>{props.text}</p>
    )
}


export class ColumnView extends Component{
    constructor(state){
        super();
        this.state=state;
    }
    
    
    render(){
        return (
            <div class="column">
                {this.state.column.title}
            </div>
        )
    }
}

export class StrategyView extends Component{
    constructor(state){
        super();
        this.state=state;
    }
    
    
    render(){
        return (
            <div class="strategy">
                {this.state.strategy.title}
            </div>
        )
    }
}

export class WorkflowView extends Component{
    constructor(state){
        super();
        this.state=state;
    }
    
    render(){
        console.log(this.state)
        var columns = this.state.columnworkflow_set.map((column)=>
            (new ColumnView(column)).render()
        )
        var strategies = this.state.strategyworkflow_set.map((strategy)=>
            (new StrategyView({strategy:strategy,columns:this.state.columnworkflow_set})).render()
        )
        
        return (
            <div class="workflow-wrapper">
                <div class = "workflow-container">
                    <Text text={this.state.title}/>
                    <Text text={this.state.description}/>
                    <div class="column-row">
                        {columns}
                    </div>
                    {strategies}
                </div>
            </div>
        );
    }
}


export function renderWorkflowView(workflow,container){
    render((new WorkflowView(workflow)).render(),container)
}
