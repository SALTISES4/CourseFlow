from io import BytesIO

import pandas as pd
import time
import re
from django.conf import settings
from django.utils import timezone
from django.utils.translation import gettext as _

from .utils import save_serializer
from .models import Outcome, OutcomeOutcome, OutcomeWorkflow
from .serializers import OutcomeSerializerShallow, OutcomeWorkflowSerializerShallow, OutcomeOutcomeSerializerShallow
from course_flow import redux_actions as actions


def add_to_outcome_parent_with_depth(to_add,base_outcome,required_depth):
    if base_outcome.depth == required_depth:
        return OutcomeOutcome.objects.create(
            child=to_add,
            parent=base_outcome,
            rank=base_outcome.children.all().count()
        )
    else:
        return add_to_outcome_parent_with_depth(to_add,base_outcome.parent_outcomes.first(),required_depth)
        

def import_outcomes(df,workflow,user):
    print(df)
    print(df.columns)
    
    
    last_outcome = None
    for index, row in df.iterrows():
        code = row['code']
        if code is not None and isinstance(code,str) and code.find(".")>=0:
            code = re.search('([^.]+$)',code).group(0)
        title = row['title']
        print(title)
        description = row['description']
        
        try:
            depth = int(row['depth'])
        except ValueError:
            depth = 0
        if last_outcome is None:
            depth=0
        elif last_outcome.depth+1<depth:
            depth=last_outcome.depth+1
        
        outcome = Outcome.objects.create(author=user,depth=depth)
        serializer = OutcomeSerializerShallow(
            outcome, data={'title':title,'description':description,'code':code}, partial=True
        )
        save_serializer(serializer)
        
        if depth==0:
            outcomeworkflow = OutcomeWorkflow.objects.create(
                workflow=workflow,
                outcome=outcome,
                rank=workflow.outcomes.all().count()
            )
            response_data = {
                "new_model": OutcomeSerializerShallow(outcome).data,
                "new_through": OutcomeWorkflowSerializerShallow(outcomeworkflow).data,
                "parentID": workflow.id,
            }
            actions.dispatch_wf(workflow, actions.newOutcomeAction(response_data))
            actions.dispatch_to_parent_wf(
                workflow, actions.newChildOutcomeAction(response_data)
            )
        else:
            outcomeoutcome = add_to_outcome_parent_with_depth(outcome,last_outcome,depth-1)
            
            new_model_serialized = OutcomeSerializerShallow(outcome).data
            new_through_serialized = OutcomeOutcomeSerializerShallow(
                outcomeoutcome
            ).data
            response_data = {
                "new_model": new_model_serialized,
                "new_through": new_through_serialized,
                "parentID": outcomeoutcome.parent.id,
            }
            actions.dispatch_wf(
                workflow, actions.insertChildAction(response_data, "outcome"),
            )
            actions.dispatch_to_parent_wf(
                workflow, actions.insertChildAction(response_data, "childoutcome")
            )
        try:
            if isinstance(code,str) and code.isnumeric():
                if outcome.depth==0:
                    rank = OutcomeWorkflow.objects.get(outcome=outcome).rank
                else:
                    rank = OutcomeOutcome.objects.get(child=outcome).rank
                if int(code)==rank:
                    outcome.code=""
                    outcome.save()
                    
        except ValueError:
            pass
            
        last_outcome=outcome
        
    