# wheretag
WhereTag (WT) is an application that make use of twitter API to generate heat map based on live stream of tweets which has been geo-tagged all over the world. The heat map interface is provided by Google Javascript API. On top of that, WT also allows user to do sentiment analysis based on the user input keyword. The result of the sentiment analysis will be categorized into positive or negative tweets depending on the text of the tweets. These results will then be displayed to users in the form of pie chart, generated using Chart.js library. Bootstrap framework is also used to ensure a clean and professional looking interface.

# Deployment instruction
1. Prerequisite:
a. A valid Azure account.
b. WhereTag application published dockerhub or github
2. Deployment of azure Ubuntu scale set as per templates provided by Azure: https://github.com/Azure/azure-quickstart-templates/tree/master/201-vmss-ubuntu-autoscale
3. Create scale set using the latest Ubuntu16.04 image
4. Create the other components necessary for scale set (Load balancer, front end IP address, health probe, open port, etc.)
5. Select auto-scale option and define auto-scaling threshold.
6. Use Putty to open up TCP connection and
a. Install Docker into Ubuntu machine from the scale set
b. Install and run the published WhereTag application by mapping port 80 to port 3000
7. The end.