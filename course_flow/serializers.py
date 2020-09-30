from rest_framework import serializers
from .models import (
    Workflow,
    Program,
    Course,
    Activity,
    Column,
    ColumnWorkflow,
    Node,
    NodeStrategy,
    StrategyWorkflow,
    Discipline,
    Strategy,
    Outcome,
    OutcomeNode,
    OutcomeWorkflow,
    NodeCompletionStatus,
    User,
)

def linkIDMap(link):
    return link.id


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["email", "username"]


class OutcomeSerializer(serializers.ModelSerializer):

    author = serializers.SlugRelatedField(
        read_only=True, slug_field="username"
    )

    class Meta:
        model = Outcome
        fields = [
            "id",
            "title",
            "description",
            "created_on",
            "last_modified",
            "hash",
            "author",
        ]

    def create(self, validated_data):
        return Outcome.objects.create(
            author=User.objects.get(username=self.initial_data["author"]),
            **validated_data
        )

    def update(self, instance, validated_data):
        instance.title = validated_data.get("title", instance.title)
        instance.description = validated_data.get(
            "description", instance.description
        )
        instance.save()
        return instance


class OutcomeNodeSerializer(serializers.ModelSerializer):

    outcome = OutcomeSerializer(allow_null=True)

    class Meta:
        model = OutcomeNode
        fields = ["node", "outcome", "added_on", "rank", "id"]

    def update(self, instance, validated_data):
        instance.rank = validated_data.get("rank", instance.title)
        outcome_data = self.initial_data.pop("outcome")
        outcome_serializer = OutcomeSerializer(
            Outcome.objects.get(id=outcome_data["id"]), outcome_data
        )
        outcome_serializer.is_valid()
        outcome_serializer.save()
        instance.save()
        return instance


class ParentNodeSerializer(serializers.ModelSerializer):

    author = serializers.SlugRelatedField(
        read_only=True, slug_field="username"
    )

    class Meta:
        model = Node
        fields = [
            "id",
            "title",
            "description",
            "last_modified",
            "hash",
            "author",
            "work_classification",
            "activity_classification",
            "classification",
        ]


class ParentStrategySerializer(serializers.ModelSerializer):

    author = serializers.SlugRelatedField(
        read_only=True, slug_field="username"
    )

    class Meta:
        model = Strategy
        fields = [
            "id",
            "title",
            "description",
            "last_modified",
            "hash",
            "author",
        ]


class NodeSerializer(serializers.ModelSerializer):

    author = serializers.SlugRelatedField(
        read_only=True, slug_field="username"
    )

    outcomenode_set = serializers.SerializerMethodField()

    parent_node = ParentNodeSerializer(allow_null=True)

    class Meta:
        model = Node
        fields = [
            "id",
            "title",
            "description",
            "created_on",
            "last_modified",
            "column",
            "hash",
            "author",
            "work_classification",
            "activity_classification",
            "classification",
            "outcomenode_set",
            "is_original",
            "parent_node",
        ]

    def get_outcomenode_set(self, instance):
        links = instance.outcomenode_set.all().order_by("rank")
        return OutcomeNodeSerializer(links, many=True).data

    def create(self, validated_data):
        return Node.objects.create(
            author=User.objects.get(username=self.initial_data["author"]),
            **validated_data
        )

    def update(self, instance, validated_data):
        instance.title = validated_data.get("title", instance.title)
        instance.description = validated_data.get(
            "description", instance.description
        )
        instance.classification = validated_data.get(
            "classification", instance.classification
        )
        instance.work_classification = validated_data.get(
            "work_classification", instance.work_classification
        )
        instance.activity_classification = validated_data.get(
            "activity_classification", instance.activity_classification
        )
        for outcomenode_data in self.initial_data.pop("outcomenode_set"):
            outcomenode_serializer = OutcomeNodeSerializer(
                OutcomeNode.objects.get(id=outcomenode_data["id"]),
                data=outcomenode_data,
            )
            outcomenode_serializer.is_valid()
            outcomenode_serializer.save()
        instance.save()
        return instance


class NodeStrategySerializer(serializers.ModelSerializer):

    node = NodeSerializer()

    class Meta:
        model = NodeStrategy
        fields = ["strategy", "node", "added_on", "rank", "id"]

    def update(self, instance, validated_data):
        instance.rank = validated_data["rank"]
        node_data = self.initial_data.pop("node")
        node_serializer = NodeSerializer(
            Node.objects.get(id=node_data["id"]), node_data
        )
        node_serializer.is_valid()
        node_serializer.save()
        instance.save()
        return instance


class ColumnSerializer(serializers.ModelSerializer):
    author = serializers.SlugRelatedField(
        read_only=True, slug_field="username"
    )

    class Meta:
        model = Column
        fields = ["id", "title", "author", "created_on", "last_modified","column_type"]

    def update(self, instance, validated_data):
        instance.title = validated_data.get("title", instance.title)
        instance.save()
        return instance

    def create(self, validated_data):
        return Column.objects.create(
            author=User.objects.get(username=self.initial_data["author"]),
            **validated_data
        )


class StrategySerializer(serializers.ModelSerializer):

    author = serializers.SlugRelatedField(
        read_only=True, slug_field="username"
    )

    nodestrategy_set = serializers.SerializerMethodField()

    outcomestrategy_set = serializers.SerializerMethodField()

    parent_strategy = ParentStrategySerializer(allow_null=True)

    num_children = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Strategy
        fields = [
            "id",
            "title",
            "description",
            "created_on",
            "last_modified",
            "hash",
            "default",
            "author",
            "nodestrategy_set",
            "outcomestrategy_set",
            "is_original",
            "parent_strategy",
            "num_children",
        ]

    def get_num_children(self, instance):
        return instance.strategy_set.count()

    def get_nodestrategy_set(self, instance):
        links = instance.nodestrategy_set.all().order_by("rank")
        return NodeStrategySerializer(links, many=True).data

    def get_outcomestrategy_set(self, instance):
        links = instance.outcomestrategy_set.all().order_by("rank")
        return OutcomeStrategySerializer(links, many=True).data

    def create(self, validated_data):
        return Strategy.objects.create(
            author=User.objects.get(username=self.initial_data["author"]),
            **validated_data
        )

    def update(self, instance, validated_data):
        instance.title = validated_data.get("title", instance.title)
        instance.description = validated_data.get(
            "description", instance.description
        )
        for nodestrategy_data in self.initial_data.pop("nodestrategy_set"):
            nodestrategy_serializer = NodeStrategySerializer(
                NodeStrategy.objects.get(id=nodestrategy_data["id"]),
                data=nodestrategy_data,
            )
            nodestrategy_serializer.is_valid()
            nodestrategy_serializer.save()
        for outcomestrategy_data in self.initial_data.pop(
            "outcomestrategy_set"
        ):
            outcomestrategy_serializer = OutcomeStrategySerializer(
                OutcomeStrategy.objects.get(id=outcomestrategy_data["id"]),
                data=outcomestrategy_data,
            )
            outcomestrategy_serializer.is_valid()
            outcomestrategy_serializer.save()
        instance.save()
        return instance


class StrategyWorkflowSerializer(serializers.ModelSerializer):

    strategy = StrategySerializer()

    class Meta:
        model = StrategyWorkflow
        fields = ["workflow", "strategy", "added_on", "rank", "id"]

    def update(self, instance, validated_data):
        instance.rank = validated_data.get("rank", instance.rank)
        strategy_data = self.initial_data.pop("strategy")
        strategy_serializer = StrategySerializer(
            Strategy.objects.get(id=strategy_data["id"]), strategy_data
        )
        if strategy_serializer.is_valid():
            strategy_serializer.save()
        instance.save()
        return instance


class ColumnWorkflowSerializer(serializers.ModelSerializer):
    column = ColumnSerializer()

    class Meta:
        model = ColumnWorkflow
        fields = ["workflow", "column", "added_on", "rank", "id"]

    def update(self, instance, validated_data):
        instance.rank = validated_data.get("rank", instance.rank)
        column_data = self.initial_data.pop("column")
        column_serializer = ColumnSerializer(
            Column.objects.get(id=column_data["id"]), column_data
        )
        if column_serializer.is_valid():
            column_serializer.save()
        instance.save()
        return instance


class OutcomeWorkflowSerializer(serializers.ModelSerializer):

    outcome = OutcomeSerializer()

    class Meta:
        model = OutcomeWorkflow
        fields = ["workflow", "outcome", "added_on", "rank", "id"]

    def update(self, instance, validated_data):
        instance.rank = validated_data.get("rank", instance.rank)
        outcome_data = self.initial_data.pop("outcome")
        outcome_serializer = OutcomeSerializer(
            Outcome.objects.get(id=outcome_data["id"]), outcome_data
        )
        outcome_serializer.is_valid()
        outcome_serializer.save()
        instance.save()
        return instance


class DisciplineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Discipline
        fields = ["id", "title"]

class WorkflowSerializer(serializers.ModelSerializer):
    
    strategyworkflow_set = serializers.SerializerMethodField()
    outcomeworkflow_set = serializers.SerializerMethodField()
    columnworkflow_set = serializers.SerializerMethodField()
    
    author = serializers.SlugRelatedField(
        read_only=True, slug_field="username"
    )
    
    def get_strategyworkflow_set(self, instance):
        links = instance.strategyworkflow_set.all().order_by("rank")
        return StrategyWorkflowSerializer(links, many=True).data
    
    def get_columnworkflow_set(self, instance):
        links = instance.columnworkflow_set.all().order_by("rank")
        return ColumnWorkflowSerializer(links, many=True).data

    def get_outcomeworkflow_set(self, instance):
        links = instance.outcomeworkflow_set.all().order_by("rank")
        return OutcomeWorkflowSerializer(links, many=True).data
    

    def update(self, instance, validated_data):
        instance.title = validated_data.get("title", instance.title)
        instance.description = validated_data.get(
            "description", instance.description
        )
        for strategyworkflow_data in self.initial_data.pop("strategyworkflow_set"):
            strategyworkflow_serializer = StrategyWorkflowSerializer(
                StrategyWorkflow.objects.get(id=strategyworkflow_data["id"]),
                data=strategyworkflow_data,
            )
            strategyworkflow_serializer.is_valid()
            strategyworkflow_serializer.save()
        for columnworkflow_data in self.initial_data.pop("columnworkflow_set"):
            columnworkflow_serializer = ColumnWorkflowSerializer(
                ColumnWorkflow.objects.get(id=columnworkflow_data["id"]),
                data=columnworkflow_data,
            )
            columnworkflow_serializer.is_valid()
            columnworkflow_serializer.save()
        for outcomeworkflow_data in self.initial_data.pop("outcomeworkflow_set"):
            outcomeworkflow_serializer = OutcomeWorkflowSerializer(
                OutcomeWorkflow.objects.get(id=outcomeworkflow_data["id"]),
                data=outcomeworkflow_data,
            )
            outcomeworkflow_serializer.is_valid()
            outcomeworkflow_serializer.save()
        instance.save()
        return instance
    
    
class ProgramSerializer(WorkflowSerializer):

    class Meta:
        model = Program
        fields = [
            "id",
            "title",
            "description",
            "author",
            "created_on",
            "last_modified",
            "hash",
            "columnworkflow_set",
            "strategyworkflow_set",
            "outcomeworkflow_set",
            "is_original",
            "parent_workflow",
        ]
        
    def create(self, validated_data):
        return Program.objects.create(
            author=User.objects.get(username=self.initial_data["author"]),
            **validated_data
        )

class CourseSerializer(WorkflowSerializer):
    
    discipline = DisciplineSerializer(read_only=True)
    
    class Meta:
        model = Course
        fields = [
            "id",
            "title",
            "description",
            "author",
            "created_on",
            "last_modified",
            "hash",
            "strategyworkflow_set",
            "outcomeworkflow_set",
            "columnworkflow_set",
            "discipline",
            "is_original",
            "parent_workflow",
        ]
        
        
    def create(self, validated_data):
        return Course.objects.create(
            author=User.objects.get(username=self.initial_data["author"]),
            **validated_data
        )
    

class ActivitySerializer(WorkflowSerializer):

    class Meta:
        model = Activity
        fields = [
            "id",
            "title",
            "description",
            "author",
            "created_on",
            "last_modified",
            "hash",
            "columnworkflow_set",
            "strategyworkflow_set",
            "outcomeworkflow_set",
            "is_original",
            "parent_workflow",
        ]

    def create(self, validated_data):
        if User.objects.filter(username=self.initial_data["author"]).exists():
            author = User.objects.get(username=self.initial_data["author"])
        else:
            author = None
        activity = Activity.objects.create(author=author, **validated_data)

        
        return activity

    
    
    
    

class NodeSerializerShallow(serializers.ModelSerializer):

    author = serializers.SlugRelatedField(
        read_only=True, slug_field="username"
    )

    outcomenode_set = serializers.SerializerMethodField()

    class Meta:
        model = Node
        fields = [
            "id",
            "title",
            "description",
            "created_on",
            "last_modified",
            "column",
            "hash",
            "author",
            "work_classification",
            "activity_classification",
            "classification",
            "outcomenode_set",
            "is_original",
            "parent_node",
        ]

    def get_outcomenode_set(self, instance):
        links = instance.outcomenode_set.all().order_by("rank")
        return list(map(linkIDMap,links))

    def create(self, validated_data):
        return Node.objects.create(
            author=User.objects.get(username=self.initial_data["author"]),
            **validated_data
        )
    
    def update(self, instance, validated_data):
        instance.title = validated_data.get("title", instance.title)
        instance.description = validated_data.get(
            "description", instance.description
        )
        instance.classification = validated_data.get(
            "classification", instance.classification
        )
        instance.work_classification = validated_data.get(
            "work_classification", instance.work_classification
        )
        instance.activity_classification = validated_data.get(
            "activity_classification", instance.activity_classification
        )
        instance.save()
        return instance

class NodeStrategySerializerShallow(serializers.ModelSerializer):

    class Meta:
        model = NodeStrategy
        fields = ["strategy", "node", "added_on", "rank", "id"]

    def update(self, instance, validated_data):
        instance.rank = validated_data.get("rank", instance.rank)
        instance.save()
        return instance

class ColumnSerializerShallow(serializers.ModelSerializer):
    author = serializers.SlugRelatedField(
        read_only=True, slug_field="username"
    )
    
    column_type_display = serializers.CharField(source='get_column_type_display')
    
    class Meta:
        model = Column
        fields = ["id", "title", "author", "created_on", "last_modified","column_type","column_type_display"]

    def create(self, validated_data):
        return Column.objects.create(
            author=User.objects.get(username=self.initial_data["author"]),
            **validated_data
        )
    
    def update(self, instance, validated_data):
        instance.title = validated_data.get("title", instance.title)
        instance.save()
        return instance


class StrategySerializerShallow(serializers.ModelSerializer):

    author = serializers.SlugRelatedField(
        read_only=True, slug_field="username"
    )
    
    nodestrategy_set = serializers.SerializerMethodField()
    outcomestrategy_set = serializers.SerializerMethodField()
    num_children = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Strategy
        fields = [
            "id",
            "title",
            "description",
            "created_on",
            "last_modified",
            "hash",
            "default",
            "author",
            "nodestrategy_set",
            "outcomestrategy_set",
            "is_original",
            "parent_strategy",
            "num_children",
        ]

    def get_num_children(self, instance):
        return instance.strategy_set.count()

    def get_nodestrategy_set(self, instance):
        links = instance.nodestrategy_set.all().order_by("rank")
        return list(map(linkIDMap,links))

    def get_outcomestrategy_set(self, instance):
        links = instance.outcomestrategy_set.all().order_by("rank")
        return list(map(linkIDMap,links))

    def create(self, validated_data):
        return Strategy.objects.create(
            author=User.objects.get(username=self.initial_data["author"]),
            **validated_data
        )
    
    def update(self, instance, validated_data):
        instance.title = validated_data.get("title", instance.title)
        instance.description = validated_data.get(
            "description", instance.description
        )
        instance.save()
        return instance


class StrategyWorkflowSerializerShallow(serializers.ModelSerializer):

    class Meta:
        model = StrategyWorkflow
        fields = ["workflow", "strategy", "added_on", "rank", "id"]

    def update(self, instance, validated_data):
        instance.rank = validated_data.get("rank", instance.rank)
        instance.save()
        return instance

class ColumnWorkflowSerializerShallow(serializers.ModelSerializer):

    class Meta:
        model = ColumnWorkflow
        fields = ["workflow", "column", "added_on", "rank", "id"]
        
    
    def update(self, instance, validated_data):
        instance.rank = validated_data.get("rank", instance.rank)
        instance.save()
        return instance

class WorkflowSerializerFinder(serializers.ModelSerializer):
    
    class Meta:
        model = Workflow
        fields = [
            "id",
            "type",
        ]
    
    def update(self, instance, validated_data):
        return instance
    
class WorkflowSerializerShallow(serializers.ModelSerializer):
    
    strategyworkflow_set = serializers.SerializerMethodField()
    outcomeworkflow_set = serializers.SerializerMethodField()
    columnworkflow_set = serializers.SerializerMethodField()
    
    author = serializers.SlugRelatedField(
        read_only=True, slug_field="username"
    )
    
    def get_strategyworkflow_set(self, instance):
        links = instance.strategyworkflow_set.all().order_by("rank")
        return list(map(linkIDMap,links))
    
    def get_columnworkflow_set(self, instance):
        links = instance.columnworkflow_set.all().order_by("rank")
        return list(map(linkIDMap,links))

    def get_outcomeworkflow_set(self, instance):
        links = instance.outcomeworkflow_set.all().order_by("rank")
        return list(map(linkIDMap,links))
    
    def update(self, instance, validated_data):
        instance.title = validated_data.get("title", instance.title)
        instance.description = validated_data.get(
            "description", instance.description
        )
        instance.save()
        return instance
    
    
class ProgramSerializerShallow(WorkflowSerializerShallow):

    class Meta:
        model = Program
        fields = [
            "id",
            "title",
            "description",
            "author",
            "created_on",
            "last_modified",
            "hash",
            "columnworkflow_set",
            "strategyworkflow_set",
            "outcomeworkflow_set",
            "is_original",
            "parent_workflow",
            "type",
        ]
        
    def create(self, validated_data):
        return Program.objects.create(
            author=User.objects.get(username=self.initial_data["author"]),
            **validated_data
        )

class CourseSerializerShallow(WorkflowSerializerShallow):
    
    discipline = DisciplineSerializer(read_only=True)
    
    class Meta:
        model = Course
        fields = [
            "id",
            "title",
            "description",
            "author",
            "created_on",
            "last_modified",
            "hash",
            "strategyworkflow_set",
            "outcomeworkflow_set",
            "columnworkflow_set",
            "discipline",
            "is_original",
            "parent_workflow",
            "type",
        ]
        
        
    def create(self, validated_data):
        return Course.objects.create(
            author=User.objects.get(username=self.initial_data["author"]),
            **validated_data
        )
    

class ActivitySerializerShallow(WorkflowSerializerShallow):

    class Meta:
        model = Activity
        fields = [
            "id",
            "title",
            "description",
            "author",
            "created_on",
            "last_modified",
            "hash",
            "columnworkflow_set",
            "strategyworkflow_set",
            "outcomeworkflow_set",
            "is_original",
            "parent_workflow",
            "type",
        ]

    def create(self, validated_data):
        if User.objects.filter(username=self.initial_data["author"]).exists():
            author = User.objects.get(username=self.initial_data["author"])
        else:
            author = None
        activity = Activity.objects.create(author=author, **validated_data)

        
        return activity
    


serializer_lookups = {
    "node": NodeSerializer,
    "strategy": StrategySerializer,
    "column": ColumnSerializer,
    "activity": ActivitySerializer,
    "course": CourseSerializer,
    "program": ProgramSerializer,
}


serializer_lookups_shallow = {
    "node": NodeSerializerShallow,
    "nodestrategy":NodeStrategySerializerShallow,
    "strategy": StrategySerializerShallow,
    "strategyworkflow":StrategyWorkflowSerializerShallow,
    "column": ColumnSerializerShallow,
    "columnworkflow":ColumnWorkflowSerializerShallow,
    "workflow":WorkflowSerializerShallow,
    "activity": ActivitySerializerShallow,
    "course": CourseSerializerShallow,
    "program": ProgramSerializerShallow,
}
