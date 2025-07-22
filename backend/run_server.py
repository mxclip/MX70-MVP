#!/usr/bin/env python3
import uvicorn
import sys
import traceback

try:
    print("Starting server...")
    uvicorn.run("test_simple:app", host="127.0.0.1", port=8003, reload=False, log_level="debug")
except Exception as e:
    print(f"Error starting server: {e}")
    traceback.print_exc()
    sys.exit(1) 