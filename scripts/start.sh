echo "var value = ${IS_HANDLER}"
#if [ $IS_HANDLER == 1 ]] ; then
#  echo "starting as handler"
#  node handler.js
#else
 # echo "starting as normal service"
  #node index.js
#fi

case "$IS_HANDLER" in
 1)  echo "starting as handler service" && node handler.js;;
 0)  echo "starting as normal service" && node index.js ;;
 *) echo "ERROR!";;
esac

