#!/bin/sh
echo "##### Running env.sh #####"
# Make sure to use the prefix KIJK_ if you have any other prefix in env.production file varialbe name replace it with KIJK_
for i in $(env | grep KIJK_)
do
    key=$(echo "$i" | cut -d '=' -f 1)
    value=$(echo "$i" | cut -d '=' -f 2-)
    echo "$key=$value"
    # sed All files
    # find /var/www/html -type f -exec sed -i "s|${key}|${value}|g" '{}' +
    # sed JS and CSS only
    find /var/www/html -type f \( -name '*.js' -o -name '*.css' \) -exec sed -i "s|${key}|${value}|g" '{}' +
done

# My own solution if the above one doesn't work for some reason
# for i in $(env | grep KIJK_)
# do
#     key=$(echo $i | cut -d '=' -f 1)
#     value=$(echo $i | cut -d '=' -f 2-)
#     echo $key=$value
#     # find /var/www/html -type f -exec sed -i "s|${key}|${value}|g" '{}' +
#     # find /var/www/html -type f \( -name '*.js' -o -name '*.css' \) -exec sed -i "s|${key}|${value}|g" '{}' +
#     find "/var/www/html" -type f -name "*.js" | while read file; do
#         sed -i "s|${key}|${value}|g" $file
#     done
# done


echo "##### Finished env.sh #####"
exec "$@"
