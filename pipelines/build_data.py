"""Rebuild all normalized factual catalogs from retained inputs, without network."""
from build_catalog import build as catalog
from build_chronology import build as chronology
from build_directory import build as directory
from build_airports import build as airports
from build_event import build as event
if __name__=='__main__':
    catalog()
    chronology()
    directory()
    event()
    airports()
