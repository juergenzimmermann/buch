Aufruf:
    cd .extras\compose\buch
    app.yml: auskommentieren
        log.level
        log.pretty
    docker compose up

    cd .extras\locust
    .\.venv\Scripts\Activate.ps1
    locust -f .\locustfile.py
    http://localhost:8089
        Number of users: 100
        Ramp Up (users started/second): 5
        Host: https://localhost:3000

--------------------------------------------------------------------------------
Statische Codeanalyse und Formatierer:
    pyright locustfile.py
    mypy locustfile.py
    pylint locustfile.py
    flake8 locustfile.py
    isort locustfile.py
    black locustfile.py
    pydocstyle locustfile.py
    refurb locustfile.py

--------------------------------------------------------------------------------
Installation:
    python -m pip install --upgrade pip
    pip install wheel setuptools

    cd .extras\locust
    python -m venv .venv
    .\.venv\Scripts\Activate.ps1
    pip install .[quality]
