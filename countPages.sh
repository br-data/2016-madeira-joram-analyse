for file in *.pdf
do
  mdls -raw -name kMDItemNumberOfPages $file
  echo
done
