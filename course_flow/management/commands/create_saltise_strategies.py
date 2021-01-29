import json

from django.core.management.base import BaseCommand

from course_flow.models import (
    Activity,
    Node,
    NodeLink,
    Column
)




class Command(BaseCommand):
    def add_arguments(self, parser):
        pass

    def handle(self, *args, **kwargs):
        #JIGSAW
        workflow = Activity.objects.create(
            title="Jigsaw",
            is_strategy=True,
            published=True,
            from_saltise=True,
        )
        week = workflow.weeks.first()
        ooci = workflow.columns.get(column_type=Column.OUT_OF_CLASS_INSTRUCTOR)
        oocs = workflow.columns.get(column_type=Column.OUT_OF_CLASS_STUDENT)
        ici = workflow.columns.get(column_type=Column.IN_CLASS_INSTRUCTOR)
        ics = workflow.columns.get(column_type=Column.IN_CLASS_STUDENT)
        week.nodes.create(
            title="Divide students into groups",
            description="Instructor divides students into small groups of five or six students.",
            column=ici
        )
        week.nodes.create(
            title="Assign a portion of an assignment",
            description="Instructor prepares an assignment and divides it into as many parts as there are students in each group. Each member of the group is assigned a portion of the assignment or research project to complete.",
            column=ici,
        )
        week.nodes.create(
            title="Research Material",
            description="In groups, students research the material(s) pertaining to their section of the assignment and prepare to discuss it with their classmates.",
            column=ics,
            context_classification=Node.GROUPS,
            task_classification=Node.GATHER_INFO,
        )
        week.nodes.create(
            title="Expert Groups",
            description="Students form temporary \"expert groups\" with others who have been assigned the same portion of the assignment and discuss the material they have covered, and prepare to present this material to their original \"jigsaw\" group.",
            column=ics,
            context_classification=Node.GROUPS,
            task_classification=Node.DISCUSS,
        )
        week.nodes.create(
            title="Present to original group",
            description="Students return to their original \"jigsaw\" group and present the material they have covered.",
            column=ics,
            context_classification=Node.INDIVIDUAL,
            task_classification=Node.PRESENT,
        )
        week.nodes.create(
            title="Complete assignment",
            description="Using their collective knowledge, students complete their assignment.",
            column=ics,
            context_classification=Node.GROUPS,
            task_classification=Node.WRITE,
        )
        week.nodes.create(
            title="Evaluation",
            description="Instructor evaluates the completed assignment. Option: Additional assessment of the students' knowledge (individual or group) can be added.",
            column=ici,
        )
        
        #PEER INSTRUCTION
        workflow = Activity.objects.create(
            title="Peer Instruction",
            is_strategy=True,
            published=True,
            from_saltise=True,
        )
        week = workflow.weeks.first()
        ooci = workflow.columns.get(column_type=Column.OUT_OF_CLASS_INSTRUCTOR)
        oocs = workflow.columns.get(column_type=Column.OUT_OF_CLASS_STUDENT)
        ici = workflow.columns.get(column_type=Column.IN_CLASS_INSTRUCTOR)
        ics = workflow.columns.get(column_type=Column.IN_CLASS_STUDENT)
        week.nodes.create(
            title="Initial Content",
            description="Instructor provides students with content (e.g., mini-lecture, pre-class reading).",
            column=ici
        )
        week.nodes.create(
            title="Multiple Choice",
            description="Instructor prepares multiple choice questions/problems.",
            column=ici
        )
        week.nodes.create(
            title="Individual answers",
            description="Individually, students answer the question and enter their vote using a polling method or device (e.g., clickers or phone app).",
            column=ics,
            context_classification=Node.INDIVIDUAL,
            task_classification=Node.PROBLEM_SOLVE,
        )
        week.nodes.create(
            title="Group Discussion",
            description="Students, in pairs or small groups, discuss their answers and explain their reasoning.",
            column=ics,
            context_classification=Node.GROUPS,
            task_classification=Node.DISCUSS,
        )
        week.nodes.create(
            title="Re-answer",
            description="Individually, students vote again and select answer based on discussion - they can either keep their original answer or change.",
            column=ics,
            context_classification=Node.INDIVIDUAL,
            task_classification=Node.PROBLEM_SOLVE,
        )
        week.nodes.create(
            title="Review",
            description="Instructor briefly reviews the concepts.",
            column=ici,
        )
        