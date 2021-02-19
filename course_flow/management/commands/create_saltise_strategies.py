import json

from django.core.management.base import BaseCommand

from course_flow.models import (
    Activity,
    Node,
    NodeLink,
    Column,
    NodeWeek,
    Week,
)




class Command(BaseCommand):
    def add_arguments(self, parser):
        pass

    def handle(self, *args, **kwargs):
        #JIGSAW
        try:
            workflow = Activity.objects.get(
                title="Jigsaw",
                is_strategy=True,
                published=True,
                from_saltise=True,
            )
            workflow.weeks.first().nodes.all().delete()
        except:
            workflow = Activity.objects.create(
                title="Jigsaw",
                is_strategy=True,
                published=True,
                from_saltise=True,
            )
        week = workflow.weeks.first()
        week.strategy_classification=Week.JIGSAW
        week.save()
        rank=0
        ooci = workflow.columns.get(column_type=Column.OUT_OF_CLASS_INSTRUCTOR)
        oocs = workflow.columns.get(column_type=Column.OUT_OF_CLASS_STUDENT)
        ici = workflow.columns.get(column_type=Column.IN_CLASS_INSTRUCTOR)
        ics = workflow.columns.get(column_type=Column.IN_CLASS_STUDENT)
        node = week.nodes.create(
            title="Divide students into groups",
            description="Instructor divides students into small groups of five or six students.",
            column=ici
        )
        nodeweek = NodeWeek.objects.get(node=node)
        nodeweek.rank=rank
        nodeweek.save()
        rank=rank+1
        node = week.nodes.create(
            title="Assign a portion of an assignment",
            description="Instructor prepares an assignment and divides it into as many parts as there are students in each group. Each member of the group is assigned a portion of the assignment or research project to complete.",
            column=ici,
        )
        nodeweek = NodeWeek.objects.get(node=node)
        nodeweek.rank=rank
        nodeweek.save()
        rank=rank+1
        node = week.nodes.create(
            title="Research Material",
            description="In groups, students research the material(s) pertaining to their section of the assignment and prepare to discuss it with their classmates.",
            column=ics,
            context_classification=Node.GROUPS,
            task_classification=Node.GATHER_INFO,
        )
        nodeweek = NodeWeek.objects.get(node=node)
        nodeweek.rank=rank
        nodeweek.save()
        rank=rank+1
        node = week.nodes.create(
            title="Expert Groups",
            description="Students form temporary \"expert groups\" with others who have been assigned the same portion of the assignment and discuss the material they have covered, and prepare to present this material to their original \"jigsaw\" group.",
            column=ics,
            context_classification=Node.GROUPS,
            task_classification=Node.DISCUSS,
        )
        nodeweek = NodeWeek.objects.get(node=node)
        nodeweek.rank=rank
        nodeweek.save()
        rank=rank+1
        node = week.nodes.create(
            title="Present to original group",
            description="Students return to their original \"jigsaw\" group and present the material they have covered.",
            column=ics,
            context_classification=Node.INDIVIDUAL,
            task_classification=Node.PRESENT,
        )
        nodeweek = NodeWeek.objects.get(node=node)
        nodeweek.rank=rank
        nodeweek.save()
        rank=rank+1
        node = week.nodes.create(
            title="Complete assignment",
            description="Using their collective knowledge, students complete their assignment.",
            column=ics,
            context_classification=Node.GROUPS,
            task_classification=Node.WRITE,
        )
        nodeweek = NodeWeek.objects.get(node=node)
        nodeweek.rank=rank
        nodeweek.save()
        rank=rank+1
        node = week.nodes.create(
            title="Evaluation",
            description="Instructor evaluates the completed assignment. Option: Additional assessment of the students' knowledge (individual or group) can be added.",
            column=ici,
        )
        nodeweek = NodeWeek.objects.get(node=node)
        nodeweek.rank=rank
        nodeweek.save()
        rank=rank+1
        for nodeweek in week.nodeweek_set.all():
            print(nodeweek.rank)
        
        #PEER INSTRUCTION
        try:
            workflow = Activity.objects.get(
                title="Peer Instruction",
                is_strategy=True,
                published=True,
                from_saltise=True,
            )
            workflow.weeks.first().nodes.all().delete()
        except:
            workflow = Activity.objects.create(
                title="Peer Instruction",
                is_strategy=True,
                published=True,
                from_saltise=True,
            )
        week = workflow.weeks.first()
        week.strategy_classification=Week.PEER_INSTRUCTION
        week.save()
        rank=0
        ooci = workflow.columns.get(column_type=Column.OUT_OF_CLASS_INSTRUCTOR)
        oocs = workflow.columns.get(column_type=Column.OUT_OF_CLASS_STUDENT)
        ici = workflow.columns.get(column_type=Column.IN_CLASS_INSTRUCTOR)
        ics = workflow.columns.get(column_type=Column.IN_CLASS_STUDENT)
        node = week.nodes.create(
            title="Initial Content",
            description="Instructor provides students with content (e.g., mini-lecture, pre-class reading).",
            column=ici
        )
        nodeweek = NodeWeek.objects.get(node=node)
        nodeweek.rank=rank
        nodeweek.save()
        rank=rank+1
        node = week.nodes.create(
            title="Multiple Choice",
            description="Instructor prepares multiple choice questions/problems.",
            column=ici
        )
        nodeweek = NodeWeek.objects.get(node=node)
        nodeweek.rank=rank
        nodeweek.save()
        rank=rank+1
        node = week.nodes.create(
            title="Individual answers",
            description="Individually, students answer the question and enter their vote using a polling method or device (e.g., clickers or phone app).",
            column=ics,
            context_classification=Node.INDIVIDUAL,
            task_classification=Node.PROBLEM_SOLVE,
        )
        nodeweek = NodeWeek.objects.get(node=node)
        nodeweek.rank=rank
        nodeweek.save()
        rank=rank+1
        node = week.nodes.create(
            title="Group Discussion",
            description="Students, in pairs or small groups, discuss their answers and explain their reasoning.",
            column=ics,
            context_classification=Node.GROUPS,
            task_classification=Node.DISCUSS,
        )
        nodeweek = NodeWeek.objects.get(node=node)
        nodeweek.rank=rank
        nodeweek.save()
        rank=rank+1
        node = week.nodes.create(
            title="Re-answer",
            description="Individually, students vote again and select answer based on discussion - they can either keep their original answer or change.",
            column=ics,
            context_classification=Node.INDIVIDUAL,
            task_classification=Node.PROBLEM_SOLVE,
        )
        nodeweek = NodeWeek.objects.get(node=node)
        nodeweek.rank=rank
        nodeweek.save()
        rank=rank+1
        node = week.nodes.create(
            title="Review",
            description="Instructor briefly reviews the concepts.",
            column=ici,
        )
        nodeweek = NodeWeek.objects.get(node=node)
        nodeweek.rank=rank
        nodeweek.save()
        rank=rank+1
        
        for nodeweek in week.nodeweek_set.all():
            print(nodeweek.rank)
            
        #CASE STUDIES
        try:
            workflow = Activity.objects.get(
                title="Case Studies",
                is_strategy=True,
                published=True,
                from_saltise=True,
            )
            workflow.weeks.first().nodes.all().delete()
        except:
            workflow = Activity.objects.create(
                title="Case Studies",
                is_strategy=True,
                published=True,
                from_saltise=True,
            )
        week = workflow.weeks.first()
        week.strategy_classification=Week.CASE_STUDIES
        week.save()
        rank=0
        ooci = workflow.columns.get(column_type=Column.OUT_OF_CLASS_INSTRUCTOR)
        oocs = workflow.columns.get(column_type=Column.OUT_OF_CLASS_STUDENT)
        ici = workflow.columns.get(column_type=Column.IN_CLASS_INSTRUCTOR)
        ics = workflow.columns.get(column_type=Column.IN_CLASS_STUDENT)
        node = week.nodes.create(
            title="Distrubute Case",
            description="Instructor selects and distributes case study (or studies) that they want students to work with.",
            column=ici
        )
        nodeweek = NodeWeek.objects.get(node=node)
        nodeweek.rank=rank
        nodeweek.save()
        rank=rank+1
        node = week.nodes.create(
            title="Read and prepare",
            description="Students - individually or in groups - read the case study and identify key components.",
            context_classification=Node.INDIVIDUAL,
            task_classification=Node.READ,
            column=ics
        )
        nodeweek = NodeWeek.objects.get(node=node)
        nodeweek.rank=rank
        nodeweek.save()
        rank=rank+1
        node = week.nodes.create(
            title="Discuss",
            description="In groups, students discuss key components and lessons learned - i.e., general principles or exceptions.",
            column=ics,
            context_classification=Node.GROUPS,
            task_classification=Node.DISCUSS,
        )
        nodeweek = NodeWeek.objects.get(node=node)
        nodeweek.rank=rank
        nodeweek.save()
        rank=rank+1
        node = week.nodes.create(
            title="Distribute new case",
            description="Instructor distributes a new case.",
            column=ici,
        )
        nodeweek = NodeWeek.objects.get(node=node)
        nodeweek.rank=rank
        nodeweek.save()
        rank=rank+1
        node = week.nodes.create(
            title="Solve new case",
            description="In groups, students work with the new case, applying lessons learned to solve it. Students apply general principles and reason as to whether or not the new case is typical or an exception.",
            column=ics,
            context_classification=Node.GROUPS,
            task_classification=Node.DISCUSS,
        )
        nodeweek = NodeWeek.objects.get(node=node)
        nodeweek.rank=rank
        nodeweek.save()
        rank=rank+1
        node = week.nodes.create(
            title="Class discussion",
            description="As a class, students discuss key components and lessons learned - i.e. general principles or exceptions.",
            column=ics,
            context_classification=Node.WHOLE_CLASS,
            task_classification=Node.DISCUSS,
        )
        nodeweek = NodeWeek.objects.get(node=node)
        nodeweek.rank=rank
        nodeweek.save()
        rank=rank+1
        
        for nodeweek in week.nodeweek_set.all():
            print(nodeweek.rank)
            
        #GALLERY WALK
        try:
            workflow = Activity.objects.get(
                title="Gallery Walk",
                is_strategy=True,
                published=True,
                from_saltise=True,
            )
            workflow.weeks.first().nodes.all().delete()
        except:
            workflow = Activity.objects.create(
                title="Gallery Walk",
                is_strategy=True,
                published=True,
                from_saltise=True,
            )
        week = workflow.weeks.first()
        week.strategy_classification=Week.GALLERY_WALK
        week.save()
        rank=0
        ooci = workflow.columns.get(column_type=Column.OUT_OF_CLASS_INSTRUCTOR)
        oocs = workflow.columns.get(column_type=Column.OUT_OF_CLASS_STUDENT)
        ici = workflow.columns.get(column_type=Column.IN_CLASS_INSTRUCTOR)
        ics = workflow.columns.get(column_type=Column.IN_CLASS_STUDENT)
        node = week.nodes.create(
            title="Assign problems",
            description="Instructor assigns a problem to each group of students. Problems may be identical or distinct, but they generally address related content.",
            column=ici
        )
        nodeweek = NodeWeek.objects.get(node=node)
        nodeweek.rank=rank
        nodeweek.save()
        rank=rank+1
        node = week.nodes.create(
            title="Solve problems",
            description="In groups, students try to solve their assigned problem.",
            context_classification=Node.GROUPS,
            task_classification=Node.PROBLEM_SOLVE,
            column=ics
        )
        nodeweek = NodeWeek.objects.get(node=node)
        nodeweek.rank=rank
        nodeweek.save()
        rank=rank+1
        node = week.nodes.create(
            title="Peer review",
            description="In groups, students move around the classroom and peer-review the work completed by another group, making annotations and providing feedback.",
            column=ics,
            context_classification=Node.GROUPS,
            task_classification=Node.ASSESS_PEERS,
        )
        nodeweek = NodeWeek.objects.get(node=node)
        nodeweek.rank=rank
        nodeweek.save()
        rank=rank+1
        node = week.nodes.create(
            title="Analyze feedback",
            description="In groups, students examine the feedback provided by their peers before finalizing their response.",
            column=ics,
            context_classification=Node.GROUPS,
            task_classification=Node.DISCUSS,
        )
        nodeweek = NodeWeek.objects.get(node=node)
        nodeweek.rank=rank
        nodeweek.save()
        rank=rank+1
        node = week.nodes.create(
            title="Class discussion",
            description="Instructor evaluates all responses with the class, highlighting any errors and distinct procedures for arriving at correct solutions.",
            column=ici,
            context_classification=Node.WHOLE_CLASS,
            task_classification=Node.DISCUSS,
        )
        nodeweek = NodeWeek.objects.get(node=node)
        nodeweek.rank=rank
        nodeweek.save()
        rank=rank+1
        
        for nodeweek in week.nodeweek_set.all():
            print(nodeweek.rank)
            
        #REFLECTIVE WRITING
        try:
            workflow = Activity.objects.get(
                title="Reflective Writing",
                is_strategy=True,
                published=True,
                from_saltise=True,
            )
            workflow.weeks.first().nodes.all().delete()
        except:
            workflow = Activity.objects.create(
                title="Reflective Writing",
                is_strategy=True,
                published=True,
                from_saltise=True,
            )
        week = workflow.weeks.first()
        week.strategy_classification=Week.REFLECTIVE_WRITING
        week.save()
        rank=0
        ooci = workflow.columns.get(column_type=Column.OUT_OF_CLASS_INSTRUCTOR)
        oocs = workflow.columns.get(column_type=Column.OUT_OF_CLASS_STUDENT)
        ici = workflow.columns.get(column_type=Column.IN_CLASS_INSTRUCTOR)
        ics = workflow.columns.get(column_type=Column.IN_CLASS_STUDENT)
        node = week.nodes.create(
            title="Assign reading",
            description="Instructor assigns reading or viewing material(s) - a section of textbook, video, etc. Specific prompts are provided to guide this task, which can include what is not understood or unclear and why it is unclear, or what is understood and how it might related to what the student already knows or to other ideas from the course.",
            column=ooci
        )
        nodeweek = NodeWeek.objects.get(node=node)
        nodeweek.rank=rank
        nodeweek.save()
        rank=rank+1
        node = week.nodes.create(
            title="Read material",
            description="Individually, students review the material with the intention of documenting in writing their understanding using the prompts.",
            column=oocs,
            context_classification=Node.INDIVIDUAL,
            task_classification=Node.READ,
        )
        nodeweek = NodeWeek.objects.get(node=node)
        nodeweek.rank=rank
        nodeweek.save()
        rank=rank+1
        node = week.nodes.create(
            title="Reflective writing",
            description="Students reflect on the material, identifying the items they understand and those with which they are struggling. They then formulate short paragraphs in response to the prompts and submit their writings to the instructor.",
            column=oocs,
            context_classification=Node.INDIVIDUAL,
            task_classification=Node.WRITE,
        )
        nodeweek = NodeWeek.objects.get(node=node)
        nodeweek.rank=rank
        nodeweek.save()
        rank=rank+1
        node = week.nodes.create(
            title="Evaluation and analysis",
            description="Instructor reviews students' work and uses it to determine the lesson plan, such as which topics need further review and explanation or what activities or materials can be used next.",
            column=ooci,
        )
        nodeweek = NodeWeek.objects.get(node=node)
        nodeweek.rank=rank
        nodeweek.save()
        rank=rank+1
        
        for nodeweek in week.nodeweek_set.all():
            print(nodeweek.rank)
            
        #TWO STAGE EXAM
        try:
            workflow = Activity.objects.get(
                title="Two Stage Exam",
                is_strategy=True,
                published=True,
                from_saltise=True,
            )
            workflow.weeks.first().nodes.all().delete()
        except:
            workflow = Activity.objects.create(
                title="Two Stage Exam",
                is_strategy=True,
                published=True,
                from_saltise=True,
            )
        week = workflow.weeks.first()
        week.strategy_classification=Week.TWO_STAGE_EXAM
        week.save()
        rank=0
        ooci = workflow.columns.get(column_type=Column.OUT_OF_CLASS_INSTRUCTOR)
        oocs = workflow.columns.get(column_type=Column.OUT_OF_CLASS_STUDENT)
        ici = workflow.columns.get(column_type=Column.IN_CLASS_INSTRUCTOR)
        ics = workflow.columns.get(column_type=Column.IN_CLASS_STUDENT)
        node = week.nodes.create(
            title="Preparation",
            description="Prior to class, instructor prepares two levels of assessment - individual and group, then in class distributes the individual assessment.",
            column=ici
        )
        nodeweek = NodeWeek.objects.get(node=node)
        nodeweek.rank=rank
        nodeweek.save()
        rank=rank+1
        node = week.nodes.create(
            title="Individual assessment",
            description="Individually, students complete the assessment.",
            context_classification=Node.INDIVIDUAL,
            task_classification=Node.PROBLEM_SOLVE,
            column=ics
        )
        nodeweek = NodeWeek.objects.get(node=node)
        nodeweek.rank=rank
        nodeweek.save()
        rank=rank+1
        node = week.nodes.create(
            title="Assign groups",
            description="Instructor collects the assessment then splits the students into small groups (3-4 students).",
            column=ici
        )
        nodeweek = NodeWeek.objects.get(node=node)
        nodeweek.rank=rank
        nodeweek.save()
        rank=rank+1
        node = week.nodes.create(
            title="Group Discussion",
            description="As groups, students discuss their answers then work together to answer the new questions.",
            column=ics,
            context_classification=Node.GROUPS,
            task_classification=Node.DISCUSS,
        )
        nodeweek = NodeWeek.objects.get(node=node)
        nodeweek.rank=rank
        nodeweek.save()
        rank=rank+1
        node = week.nodes.create(
            title="Group assessment",
            description="As a group, students complete the group assessment.",
            column=ics,
            context_classification=Node.GROUPS,
            task_classification=Node.PROBLEM_SOLVE,
        )
        nodeweek = NodeWeek.objects.get(node=node)
        nodeweek.rank=rank
        nodeweek.save()
        rank=rank+1
        node = week.nodes.create(
            title="Evaluation",
            description="Instructor collects the group assessment, and evaluates both.",
            column=ici,
        )
        nodeweek = NodeWeek.objects.get(node=node)
        nodeweek.rank=rank
        nodeweek.save()
        rank=rank+1
        
        for nodeweek in week.nodeweek_set.all():
            print(nodeweek.rank)
