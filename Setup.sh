#!/bin/bash

Dependencies=./Dependencies

export LD_LIBRARY_PATH=./lib:${Dependencies}/zeromq-4.0.7/lib:${Dependencies}/boost_1_66_0/install/lib:$LD_LIBRARY_PATH
