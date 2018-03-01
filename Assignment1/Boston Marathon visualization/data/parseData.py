infile = open("mens.csv", "r")
infile2 = open("womens.csv", "r")
outfile = open("allData.txt", "w")

header = infile.readline().split(",")
outfile.write("Index," + header[0] + "," + header[1])

for line in infile.readlines():
    lineArray = line.split(",")
    outfile.write("0," + lineArray[0] + ","+ lineArray[1])
junk = infile2.readline()
for line in infile2.readlines():
    lineArray = line.split(",")
    outfile.write("1," + lineArray[0] + ","+ lineArray[1])


outfile.close()
infile.close()
