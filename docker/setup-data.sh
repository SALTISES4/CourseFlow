#!/bin/bash
python3 manage.py  migrate
python3 manage.py  create_saltise_strategies
python3 manage.py  create_base_disciplines
