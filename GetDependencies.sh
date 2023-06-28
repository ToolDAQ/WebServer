#!/bin/bash

threads=`nproc --all`

mkdir Dependencies


cd Dependencies

git clone https://github.com/ToolDAQ/zeromq-4.0.7.git

cd zeromq-4.0.7

./configure --prefix=`pwd`
make -j $threads
make install

export LD_LIBRARY_PATH=`pwd`/lib:$LD_LIBRARY_PATH

cd ../

git clone https://github.com/ToolDAQ/boost_1_66_0.git

cd boost_1_66_0

rm -rf INSTALL    
mkdir install 

./bootstrap.sh --prefix=`pwd`/install/  > /dev/null 2>/dev/null
./b2 install iostreams -j $threads
    
export LD_LIBRARY_PATH=`pwd`/install/lib:$LD_LIBRARY_PATH

cd ../..

make
