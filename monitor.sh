chmod +x busybox

CURRENT_NAMESPACE="ximiximi1-dev"
DEPLOYMENT_NAME="go-basic"
KUBE_TOKEN="eyJhbGciOiJSUzI1NiIsImtpZCI6Imk0dE5mbFZCX3JxSGlwTTUzVW9NclBwTHhnVkJIRW5IT0tVS3kxaG1pVkkifQ.eyJpc3MiOiJrdWJlcm5ldGVzL3NlcnZpY2VhY2NvdW50Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9uYW1lc3BhY2UiOiJ4aW1peGltaTEtZGV2Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9zZWNyZXQubmFtZSI6Im15dGVzdHNhLXRva2VuLTViOGY3Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9zZXJ2aWNlLWFjY291bnQubmFtZSI6Im15dGVzdHNhIiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9zZXJ2aWNlLWFjY291bnQudWlkIjoiMjRjMDE1ZjktMzcwMC00M2FjLTkzMzUtNDU0NjYzYmY1MTEwIiwic3ViIjoic3lzdGVtOnNlcnZpY2VhY2NvdW50OnhpbWl4aW1pMS1kZXY6bXl0ZXN0c2EifQ.TpEBGDRbyOzabajqT3abb6cemQViqRlrp2Oxeua3VepyxAbi_qnPsFyJfn_FvcO6j94M_Hai2vRSTuRuGA2Lcb7LEFqiieEJW16keUx10l-55RuyudGDjOTbc4Y4H17GT-NPSNmmf8igDZSPZRDb9hNqeOhK-mbPNkzL9hd05WXlIeLpXrKVlLVOqYTM0jdg4ATvnoRdDRm5RDJjwKvHRUakKh88odoZNKUccFFc798FrNP3UxGTTT0QaTNuRFSvV7-ZuEe-Y7wusoHw8ja3_viMqE83Mk0wbhgPpGYR63ipG0ESzX8doa9zl23kJZ0cgSUcQuHtdWZzfRH66Wdopwoe8iP9E6YHCAjFCSpb21eCkHZ-JAtYxhPqZjwFEof7c_cAsWA48nZInMbxSInCzzcgQMJFm3L1exu_66gOhM2aXCGMkrKYktFIG-ZkX8D3_7j88pYVYxuNDopBhZ6iKionEbkCCGCMkls-b_-TPeGhFXBYETpKwGvmk1JGDET6Rfd1yqXL2riaEuQdKVI3IReVouxKjK1rY01ETlsZLpACeK-dtR88nY3HBvi-sPid6fzqX9CS_LUcFSOHAR8BVIE3o95amw4f-eXZlDgnF0B8Nb9pJvl35Q7oVtSY7CWlX0obrpK9r3VSe310yBLPJLeQLINYwQ3cH-DaEzXG8O0"
PAYLOAD="{\"spec\":{\"replicas\":0}}"


dostop(){
    echo "这是我的第一个 shell 函数!"
    curl -X PATCH \
        -H "Content-Type: application/strategic-merge-patch+json" \
        -H "Authorization: Bearer $KUBE_TOKEN" \
        --data "$PAYLOAD" \
        https://api.sandbox-m3.1530.p1.openshiftapps.com:6443/apis/apps/v1/namespaces/$CURRENT_NAMESPACE/deployments/$DEPLOYMENT_NAME
    #exit
}

count=0

while true
do
  # loop infinitely
    str=$(./busybox netstat -an | grep ESTABLISHED | grep :8080)
    str1=($str)
    if [ $str1 ]
    then 
        count=0
        #echo $count
    else
        let count+=1;
        #echo $count
    fi
    if [ $count -gt 30 ]
    then
        #echo stop
        dostop
    fi
    sleep 60
done