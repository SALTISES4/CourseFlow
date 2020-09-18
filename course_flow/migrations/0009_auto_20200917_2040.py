# Generated by Django 2.2.16 on 2020-09-17 20:40

from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings

def switch_course_to_workflow(apps, schema_editor):
    OldCourse = apps.get_model('course_flow','OldCourse')
    NewCourse = apps.get_model('course_flow','NewCourse')
    WeekCourse = apps.get_model('course_flow','WeekCourse')
    OutcomeCourse = apps.get_model('course_flow','OutcomeCourse')
    StrategyWorkflow = apps.get_model('course_flow','StrategyWorkflow')
    OutcomeWorkflow = apps.get_model('course_flow','OutcomeWorkflow')
    Strategy = apps.get_model('course_flow','Strategy')
    NodeStrategy = apps.get_model('course_flow','NodeStrategy')
    ComponentWeek = apps.get_model('course_flow','ComponentWeek')
    Node = apps.get_model('course_flow','Node')
    Component = apps.get_model('course_flow','Component')
    Preparation = apps.get_model('course_flow','Preparation')
    Assessment = apps.get_model('course_flow','Assessment')
    Activity = apps.get_model('course_flow','Activity')
    Artifact = apps.get_model('course_flow','Artifact')
    User = apps.get_model('auth','User')
    from django.contrib.contenttypes.models import ContentType
    for act in OldCourse.objects.all():
        newact = NewCourse.objects.create(
            author=act.author,
            title=act.title,
            description = act.description,
            created_on = act.created_on,
            last_modified = act.last_modified,
            static = act.static,
            parent_activity=act.parent_course,
            is_original=act.is_original,
            
        )
        for week in act.weeks.all():
            print(week.author)
            strat = Strategy.objects.create(
                title=week.title,
                description = "Week",
                author = week.author,
                created_on = week.created_on,
                last_modified = week.last_modified,
            )
            for component in week.components.all():
                compobj = ContentType.objects.get(model=component.content_type.model).get_object_for_this_type(pk=component.object_id)
                print(compobj.author.pk)
                node = Node.objects.create(
                    title=compobj.title,
                    description = compobj.description,
                    author = User.objects.get(pk=compobj.author.id),
                )
                NodeStrategy.objects.create(
                    node = node,
                    strategy = strat,
                    rank = ComponentWeek.objects.get(week=week,component=component).rank
                )
                
                
            
            StrategyWorkflow.objects.create(
                strategy=strat,
                workflow = newact,
                rank = WeekCourse.objects.get(week=week, course=act).rank
            )
            week.delete()
        for strat in act.outcomes.all():
            OutcomeWorkflow.objects.create(
                outcome=strat,
                workflow = newact,
                rank = OutcomeCourse.objects.get(outcome=strat,course=act).rank
            )
        act.delete()

def switch_course_to_noworkflow(apps, schema_editor):
    OldCourse = apps.get_model('course_flow','OldCourse')
    NewCourse = apps.get_model('course_flow','NewCourse')
    WeekCourse = apps.get_model('course_flow','WeekCourse')
    OutcomeCourse = apps.get_model('course_flow','OutcomeCourse')
    StrategyWorkflow = apps.get_model('course_flow','StrategyWorkflow')
    OutcomeWorkflow = apps.get_model('course_flow','OutcomeWorkflow')
    Strategy = apps.get_model('course_flow','Strategy')
    NodeStrategy = apps.get_model('course_flow','NodeStrategy')
    ComponentWeek = apps.get_model('course_flow','ComponentWeek')
    Node = apps.get_model('course_flow','Node')
    for act in NewCourse.objects.all():
        newact = OldCourse.objects.create(
            author=act.author,
            title=act.title,
            description = act.description,
            created_on = act.created_on,
            last_modified = act.last_modified,
            static = act.static,
            parent_activity=act.parent_course,
            is_original=act.is_original,
            
        )
        for week in act.strategies.all():
            strat = Week.objects.create(
                title=week.title,
                author = week.author,
                created_on = week.created_on,
                last_modified = week.last_modified,
            )               
                
            
            WeekCourse.objects.create(
                week=strat,
                course = newact,
                rank = StrategyWorkflow.objects.get(workflow=act, strategy=week).rank
            )
            week.delete()
        for strat in act.outcomes.all():
            OutcomeCourse.objects.create(
                outcome=strat,
                course = newact,
                rank = OutcomeWorkflow.objects.get(outcome=strat,workflow=act).rank
            )
        act.delete()        
    
def switch_program_to_workflow(apps, schema_editor):
    OldProgram = apps.get_model('course_flow','OldProgram')
    NewProgram = apps.get_model('course_flow','NewProgram')
    OutcomeProgram = apps.get_model('course_flow','OutcomeProgram')
    OutcomeWorkflow = apps.get_model('course_flow','OutcomeWorkflow')
    StrategyWorkflow = apps.get_model('course_flow','StrategyWorkflow')
    for act in OldProgram.objects.all():
        newact = NewProgram.objects.create(
            author=act.author,
            title=act.title,
            description = act.description,
            created_on = act.created_on,
            last_modified = act.last_modified,
            static = act.static,
        )
        for strat in act.outcomes.all():
            OutcomeWorkflow.objects.create(
                outcome=strat,
                workflow = newact,
                rank = OutcomeProgram.objects.get(outcome=strat,program=act).rank
            )
        act.delete()
        

def switch_program_to_noworkflow(apps, schema_editor):
    OldProgram = apps.get_model('course_flow','OldProgram')
    NewProgram = apps.get_model('course_flow','NewProgram')
    OutcomeProgram = apps.get_model('course_flow','OutcomeProgram')
    OutcomeWorkflow = apps.get_model('course_flow','OutcomeWorkflow')
    StrategyWorkflow = apps.get_model('course_flow','StrategyWorkflow')
    for act in NewProgram.objects.all():
        newact = OldProgram.objects.create(
            author=act.author,
            title=act.title,
            description = act.description,
            created_on = act.created_on,
            last_modified = act.last_modified,
            static = act.static,
        )
        for strat in act.outcomes.all():
            OutcomeProgram.objects.create(
                outcome=strat,
                program= newact,
                rank = OutcomeWorkflow.objects.get(outcome=strat,program=act).rank
            )
        act.delete()
        




class Migration(migrations.Migration):

    dependencies = [
        ('course_flow', '0008_auto_20200917_2034'),
    ]

    operations = [
        migrations.RenameModel('Course','OldCourse'),
        migrations.RenameModel('Program','OldProgram'),
        migrations.CreateModel(
            name="NewCourse",
            fields=[
                (
                    'workflow_ptr',
                    models.OneToOneField(
                        auto_created=True, 
                        on_delete=django.db.models.deletion.CASCADE, 
                        parent_link=True, 
                        primary_key=True, 
                        serialize=False, 
                        to='course_flow.Workflow'
                    )
                ),
                (
                    "author",
                    models.ForeignKey(
                        related_name="authored_courses",
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to=settings.AUTH_USER_MODEL,
                    )
                ),
                (
                    "students",
                    models.ManyToManyField(
                        blank=True,
                        related_name="assigned_courses",
                        to=settings.AUTH_USER_MODEL,
                    )
                ),
                (
                    "discipline",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to='course_flow.Discipline',
                    )
                ),
            ],
            bases=('course_flow.workflow',),
        ),
        migrations.CreateModel(
            name="NewProgram",
            fields=[
                (
                    'workflow_ptr',
                    models.OneToOneField(
                        auto_created=True, 
                        on_delete=django.db.models.deletion.CASCADE, 
                        parent_link=True, 
                        primary_key=True, 
                        serialize=False, 
                        to='course_flow.Workflow'
                    )
                ),
                (
                    "author",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to=settings.AUTH_USER_MODEL,
                    )
                ),
            ],
            bases=('course_flow.workflow',),
        ),
        migrations.RunPython(switch_course_to_workflow,switch_course_to_noworkflow),
        migrations.RunPython(switch_program_to_workflow,switch_program_to_noworkflow),
        migrations.DeleteModel('OldCourse'),
        migrations.DeleteModel('WeekCourse'),
        migrations.DeleteModel('OutcomeCourse'),
        migrations.DeleteModel('OldProgram'),
        migrations.DeleteModel('OutcomeProgram'),
        migrations.DeleteModel('ComponentProgram'),
        migrations.RenameModel('NewCourse','Course'),
        migrations.RenameModel('NewProgram','Program'),
        
    ]