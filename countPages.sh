#!/bin/bash
# Usage: Sum of all pages of all PDF files in a certain directory
for file in *.pdf
do
  mdls -raw -name kMDItemNumberOfPages "$file"
  echo
done
