import * as Redux from "redux";
import * as React from "react";
import * as reactDom from "react-dom";
import {setUserPermission,getUsersForObject,getUserList} from "./PostFunctions";
import {Loader} from "./Constants";

export class ImportMenu extends React.Component{
    constructor(props){
        super(props);
    }
    
    render(){
        console.log(root);
        
        return(
            <div class="message-wrap">
                <h3>{gettext("Import Files")+":"}</h3>
                <p>{gettext("Use this menu to upload content in either .xls or .csv format. Ensure you have the correct format.")}</p>
                <form  enctype="multipart/form-data" action={post_paths.import_data} method="POST" id="upload-form" target="redirect-iframe">
                    <input type="hidden" name="csrfmiddlewaretoken" value={root.getCsrfToken()}/>
                    <input type="hidden" id="objectID" name="objectID" value={this.props.data.object_id}/>
                    <input type="hidden" id="objectType" name="objectType" value={this.props.data.object_type}/>
                    <input type="hidden" id="importType" name="importType" value={this.props.data.import_type}/>
                    <input type="file" id="myFile" name="myFile" accept=".xls, .xlsx, .csv"/>
                    <input type="submit"/>
                </form>
                <iframe hidden name="redirect-iframe" id='redirect-iframe'></iframe>
            </div>
        );
    }
    
}
